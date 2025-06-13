import { BaseAICoachService } from './service';
import { ContextBuilder } from './context-builder';
import type {
  MesocycleAnalysis,
  GeneratedMesocycle,
  ExerciseSuggestion,
  RecoveryAnalysis,
  CoachResponse,
  QuickAction,
  MesocycleParams,
  ExerciseContext,
  CoachContext,
} from '@/types/ai-coach';
import type { WeekIntensity } from '@/types/progression';

interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class OpenAICoachService extends BaseAICoachService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private contextBuilder: ContextBuilder;
  private maxRetries = 3;

  constructor(config: OpenAIConfig) {
    super();
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4-turbo-preview';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.7;
    this.contextBuilder = new ContextBuilder();
  }

  private async delay(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async chat(message: string, context: CoachContext): Promise<CoachResponse> {
    const systemPrompt = await this.contextBuilder.buildSystemPrompt(context);
    const userContext = context.userId
      ? await this.contextBuilder.buildUserContext(context.userId)
      : null;

    const response = (await this.makeOpenAIRequest({
      messages: [
        { role: 'system', content: systemPrompt },
        ...(userContext
          ? [
              {
                role: 'system',
                content: `User Context: ${JSON.stringify(userContext)}`,
              },
            ]
          : []),
        { role: 'user', content: message },
      ],
      stream: true,
    })) as Response;

    return {
      message: '',
      stream: response.body ?? undefined,
    };
  }

  async generateQuickActions(context: CoachContext): Promise<QuickAction[]> {
    const systemPrompt = `You are a weightlifting coach. Based on the current context, suggest 3-5 quick actions the user might want to take. Return as JSON array.`;

    const contextPrompt = `
      Current page: ${context.currentPage}
      Mode: ${context.mode}
      ${context.selectedExercise ? `Selected exercise: ${context.selectedExercise}` : ''}
      ${context.activeMesocycle ? `Active mesocycle: ${context.activeMesocycle}` : ''}
    `;

    const response = await this.makeOpenAIRequest({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextPrompt },
      ],
    });

    const actions = this.parseJSON<
      Array<{
        id: string;
        label: string;
        icon?: string;
        category: 'training' | 'recovery' | 'analysis' | 'planning';
      }>
    >(response as string);
    return (
      actions?.map((action) => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        category: action.category,
        action: () => console.log('Action:', action),
      })) || []
    );
  }

  async analyzeMesocycleProgress(
    mesocycleId: string,
  ): Promise<MesocycleAnalysis> {
    const mesocycleData =
      await this.contextBuilder.getMesocycleData(mesocycleId);

    const prompt = `
      Analyze the following mesocycle progress and provide:
      1. Progress score (0-100)
      2. Adherence rate
      3. Strength gains per exercise
      4. Recommendations
      5. Suggested adjustments

      Mesocycle data: ${JSON.stringify(mesocycleData)}

      Return as JSON matching the MesocycleAnalysis interface.
    `;

    const response = await this.makeOpenAIRequest({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert weightlifting coach analyzing training progress.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return (
      this.parseJSON<MesocycleAnalysis>(response as string) || {
        mesocycleId,
        progressScore: 0,
        adherenceRate: 0,
        strengthGains: [],
        recommendations: ['Unable to analyze progress'],
        suggestedAdjustments: [],
      }
    );
  }

  async generateMesocycle(
    params: MesocycleParams,
  ): Promise<GeneratedMesocycle> {
    const exerciseDatabase = await this.contextBuilder.getExerciseDatabase();

    const prompt = `
      Create a ${params.duration}-week mesocycle with the following parameters:
      - Goal: ${params.goal}
      - Experience: ${params.experience}
      - Workouts per week: ${params.workoutsPerWeek}
      - Equipment: ${params.equipment.join(', ')}
      - Focus muscles: ${params.focusMuscles.join(', ')}
      ${params.preferences?.avoidExercises ? `- Avoid: ${params.preferences.avoidExercises.join(', ')}` : ''}
      ${params.preferences?.preferredExercises ? `- Prefer: ${params.preferences.preferredExercises.join(', ')}` : ''}

      Available exercises: ${JSON.stringify(exerciseDatabase)}

      Return a complete mesocycle plan as JSON matching the GeneratedMesocycle interface.
    `;

    const response = await this.makeOpenAIRequest({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert strength coach creating personalized training programs.',
        },
        { role: 'user', content: prompt },
      ],
      maxTokens: 3000,
    });

    return (
      this.parseJSON<GeneratedMesocycle>(response as string) || {
        name: 'AI Generated Mesocycle',
        duration: params.duration,
        goal: params.goal,
        workoutsPerWeek: params.workoutsPerWeek,
        exercises: {},
        progressionStrategy: 'linear',
        weekIntensities: [],
      }
    );
  }

  async suggestExercises(
    context: ExerciseContext,
  ): Promise<ExerciseSuggestion[]> {
    const exerciseDatabase = await this.contextBuilder.getExerciseDatabase();

    const prompt = `
      Suggest 5-8 exercises based on:
      - Target muscles: ${context.muscleGroups.join(', ')}
      - Available equipment: ${context.equipment.join(', ')}
      - Goals: ${context.goals.join(', ')}
      ${context.recentExercises ? `- Recent exercises to vary from: ${context.recentExercises.join(', ')}` : ''}
      ${context.avoidExercises ? `- Exercises to avoid: ${context.avoidExercises.join(', ')}` : ''}

      Available exercises: ${JSON.stringify(exerciseDatabase)}

      Return as JSON array of ExerciseSuggestion objects.
    `;

    const response = await this.makeOpenAIRequest({
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledgeable strength coach recommending exercises.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return this.parseJSON<ExerciseSuggestion[]>(response as string) || [];
  }

  async analyzeRecovery(
    workoutHistory: Array<{
      id: string;
      date: string;
      exercises: Array<{ name: string; sets: number; volume: number }>;
    }>,
  ): Promise<RecoveryAnalysis> {
    const prompt = `
      Analyze the following workout history for recovery status:
      ${JSON.stringify(workoutHistory)}

      Consider:
      - Training frequency and volume
      - Muscle group overlap
      - Intensity levels
      - Rest days

      Return a RecoveryAnalysis object as JSON.
    `;

    const response = await this.makeOpenAIRequest({
      messages: [
        {
          role: 'system',
          content: 'You are a recovery specialist analyzing training fatigue.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return (
      this.parseJSON<RecoveryAnalysis>(response as string) || {
        recoveryScore: 50,
        fatigueLevels: {
          muscular: 50,
          neural: 50,
          overall: 50,
        },
        recommendations: ['Unable to analyze recovery'],
        suggestedRestDays: 1,
      }
    );
  }

  async adjustIntensity(
    currentPlan: WeekIntensity[],
    performance: {
      completionRate: number;
      volumeProgression: number;
      intensityAdherence: number;
    },
  ): Promise<WeekIntensity[]> {
    const prompt = `
      Adjust the following training intensity plan based on performance data:
      
      Current plan: ${JSON.stringify(currentPlan)}
      Performance data: ${JSON.stringify(performance)}

      Consider:
      - If user is exceeding targets, increase intensity
      - If user is struggling, reduce intensity
      - Maintain progressive overload principles

      Return adjusted WeekIntensity array as JSON.
    `;

    const response = await this.makeOpenAIRequest({
      messages: [
        {
          role: 'system',
          content:
            'You are a periodization expert adjusting training intensity.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return this.parseJSON<WeekIntensity[]>(response as string) || currentPlan;
  }

  private async makeOpenAIRequest(params: {
    messages: Array<{ role: string; content: string }>;
    stream?: boolean;
    maxTokens?: number;
  }): Promise<Response | string> {
    // Basic token approximation: characters / 4 (roughly 4 chars per token for English)
    const approxPromptTokens = Math.round(
      params.messages.reduce((len, m) => len + m.content.length, 0) / 4,
    );

    const targetModel = this.model;
    const requestedMaxTokens = params.maxTokens || this.maxTokens;

    for (let attempt = 0; attempt < this.maxRetries; attempt += 1) {
      console.info(
        `[OpenAI] Attempt ${attempt + 1}/${this.maxRetries} | model=${targetModel} | promptTokens≈${approxPromptTokens} | maxTokens=${requestedMaxTokens} | stream=${
          params.stream ?? false
        }`,
      );
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: params.messages,
            max_tokens: requestedMaxTokens,
            temperature: this.temperature,
            stream: params.stream || false,
          }),
        },
      );

      // Log rate-limit headers whenever we get a response
      const remainingReq = response.headers.get(
        'x-ratelimit-remaining-requests',
      );
      const remainingTpm = response.headers.get('x-ratelimit-remaining-tokens');
      const reset = response.headers.get('x-ratelimit-reset-requests');
      console.info(
        `[OpenAI] Response status=${response.status} | remainingRPM=${remainingReq} | remainingTPM=${remainingTpm} | resetRPM=${reset}`,
      );

      if (response.ok) {
        if (params.stream) {
          return response;
        }

        const data = await response.json();
        if (data?.usage) {
          console.info(
            `[OpenAI] Usage prompt_tokens=${data.usage.prompt_tokens} completion_tokens=${data.usage.completion_tokens} total_tokens=${data.usage.total_tokens}`,
          );
        }
        return data.choices[0].message.content;
      }

      // Handle rate limiting and transient errors with retry logic
      if (
        [429, 502, 503, 504].includes(response.status) &&
        attempt < this.maxRetries - 1
      ) {
        const backoff = 2 ** attempt * 1000 + Math.random() * 1000; // jitter
        console.warn(
          `OpenAI request failed with status ${response.status}. Retrying in ${Math.round(
            backoff,
          )}ms (attempt ${attempt + 1}/${this.maxRetries})`,
        );
        await this.delay(backoff);
        continue;
      }

      // If not retried, throw an error with additional context
      const errorText = await response.text();
      console.error(`[OpenAI] Error body: ${errorText}`);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    // This point should never be reached, but TypeScript needs a return
    throw new Error('OpenAI API error: Exhausted retries');
  }
}
