import type {
  AICoachService,
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

export interface AICoachService {
  // Core coaching functions
  analyzeMesocycleProgress(mesocycleId: string): Promise<MesocycleAnalysis>;
  generateMesocycle(params: MesocycleParams): Promise<GeneratedMesocycle>;
  suggestExercises(context: ExerciseContext): Promise<ExerciseSuggestion[]>;
  analyzeRecovery(
    workoutHistory: Array<{
      id: string;
      date: string;
      exercises: Array<{ name: string; sets: number; volume: number }>;
    }>,
  ): Promise<RecoveryAnalysis>;
  adjustIntensity(
    currentPlan: WeekIntensity[],
    performance: {
      completionRate: number;
      volumeProgression: number;
      intensityAdherence: number;
    },
  ): Promise<WeekIntensity[]>;

  // Chat interface
  chat(message: string, context: CoachContext): Promise<CoachResponse>;
  generateQuickActions(context: CoachContext): Promise<QuickAction[]>;
}

export abstract class BaseAICoachService implements AICoachService {
  abstract analyzeMesocycleProgress(
    mesocycleId: string,
  ): Promise<MesocycleAnalysis>;
  abstract generateMesocycle(
    params: MesocycleParams,
  ): Promise<GeneratedMesocycle>;
  abstract suggestExercises(
    context: ExerciseContext,
  ): Promise<ExerciseSuggestion[]>;
  abstract analyzeRecovery(
    workoutHistory: Array<{
      id: string;
      date: string;
      exercises: Array<{ name: string; sets: number; volume: number }>;
    }>,
  ): Promise<RecoveryAnalysis>;
  abstract adjustIntensity(
    currentPlan: WeekIntensity[],
    performance: {
      completionRate: number;
      volumeProgression: number;
      intensityAdherence: number;
    },
  ): Promise<WeekIntensity[]>;
  abstract chat(message: string, context: CoachContext): Promise<CoachResponse>;
  abstract generateQuickActions(context: CoachContext): Promise<QuickAction[]>;

  protected formatPrompt(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    return Object.entries(variables).reduce(
      (prompt, [key, value]) =>
        prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
      template,
    );
  }

  protected parseJSON<T>(text: string): T | null {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(jsonString.trim());
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  }
}
