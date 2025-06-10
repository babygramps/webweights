export type CoachInteractionMode =
  | 'chat' // Conversational interface
  | 'quick-action' // One-tap contextual actions
  | 'guided-flow' // Step-by-step wizards
  | 'analysis'; // Data visualization with insights

export interface CoachContext {
  mode: CoachInteractionMode;
  currentPage: string;
  selectedExercise?: string;
  activeMesocycle?: string;
  recentWorkouts?: string[];
  userId?: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    action?: CoachAction;
    analysis?: AnalysisResult;
    suggestions?: Suggestion[];
  };
}

export interface CoachAction {
  type:
    | 'create-mesocycle'
    | 'adjust-intensity'
    | 'suggest-exercise'
    | 'analyze-progress';
  params: Record<string, unknown>;
  status: 'pending' | 'completed' | 'failed';
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: () => void | Promise<void>;
  category: 'training' | 'recovery' | 'analysis' | 'planning';
}

export interface MesocycleAnalysis {
  mesocycleId: string;
  progressScore: number; // 0-100
  adherenceRate: number;
  strengthGains: ExerciseProgress[];
  recommendations: string[];
  suggestedAdjustments: IntensityAdjustment[];
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  startingWeight: number;
  currentWeight: number;
  percentageIncrease: number;
  totalVolume: number;
}

export interface IntensityAdjustment {
  weekNumber: number;
  parameter: 'sets' | 'reps' | 'weight' | 'rir' | 'rpe';
  currentValue: number;
  suggestedValue: number;
  reason: string;
}

export interface RecoveryAnalysis {
  recoveryScore: number; // 0-100
  fatigueLevels: {
    muscular: number;
    neural: number;
    overall: number;
  };
  recommendations: string[];
  suggestedRestDays: number;
}

export interface Suggestion {
  id: string;
  type: 'exercise' | 'mesocycle' | 'recovery' | 'technique';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: () => void;
}

export interface ExerciseSuggestion {
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  reason: string;
  substitutionFor?: string;
  sets?: number;
  reps?: string;
  intensity?: string;
}

export interface GeneratedMesocycle {
  name: string;
  duration: number;
  goal: string;
  workoutsPerWeek: number;
  exercises: {
    [day: string]: ExerciseSuggestion[];
  };
  progressionStrategy: string;
  weekIntensities: Array<{
    weekNumber: number;
    setMultiplier: number;
    repRange: string;
    rirTarget: number;
    rpeTarget: number;
  }>;
}

export interface MesocycleParams {
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'power';
  experience: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  workoutsPerWeek: number;
  equipment: string[];
  focusMuscles: string[];
  preferences?: {
    avoidExercises?: string[];
    preferredExercises?: string[];
    timePerWorkout?: number;
  };
}

export interface AnalysisResult {
  type: 'progress' | 'form' | 'recovery' | 'plateau';
  score: number;
  insights: string[];
  visualData?: Record<string, unknown>;
}

export interface UserContext {
  profile: {
    id: string;
    experience: string;
    goals: string[];
    injuries?: string[];
  };
  recentWorkouts: {
    count: number;
    avgDuration: number;
    muscleGroupFrequency: Record<string, number>;
    totalVolume: number;
  };
  mesocycle: {
    id: string;
    name: string;
    week: number;
    progress: number;
    adherence: number;
  } | null;
  strengths: string[];
  weaknesses: string[];
}

export interface CoachResponse {
  message: string;
  actions?: CoachAction[];
  suggestions?: Suggestion[];
  analysis?: AnalysisResult;
  stream?: ReadableStream<Uint8Array>;
}

export interface ExerciseContext {
  muscleGroups: string[];
  equipment: string[];
  goals: string[];
  recentExercises?: string[];
  avoidExercises?: string[];
}
