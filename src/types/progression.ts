export interface IntensityParameters {
  volume: number; // relative to baseline (100% = week 1)
  weight: number; // percentage increase from baseline
  rir: number; // RIR target (lower = more intense)
  rpe: number; // RPE target (higher = more intense)
  sets: number; // multiplier for sets (1.0 = baseline)
  repsModifier: number; // multiplier for reps (1.0 = baseline)
}

export interface WeekIntensity {
  week: number;
  intensity: IntensityParameters;
  isDeload: boolean;
  notes?: string;
  label?: string; // e.g., "Build Week", "Peak Week", "Deload"
}

export interface MesocycleProgression {
  id: string;
  mesocycleId: string;
  baselineWeek: WeekIntensity;
  weeklyProgressions: WeekIntensity[];
  progressionType: ProgressionType;
  globalSettings: GlobalProgressionSettings;
}

export type ProgressionType =
  | 'linear'
  | 'wave'
  | 'block'
  | 'undulating'
  | 'step'
  | 'custom';

export interface GlobalProgressionSettings {
  autoDeload: boolean;
  deloadFrequency: number; // every N weeks
  deloadIntensity: number; // percentage of normal intensity
  mainLiftProgression: number; // weekly weight increase %
  accessoryProgression: number; // weekly volume increase %
  fatigueThreshold: number; // auto-suggest deload when reached
}

export interface ProgressionTemplate {
  id: string;
  name: string;
  description: string;
  type: ProgressionType;
  weekPattern: IntensityParameters[];
  targetGoal: 'strength' | 'hypertrophy' | 'endurance' | 'powerlifting';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // suggested weeks
}

export interface ExerciseSpecificProgression {
  exerciseId: string;
  exerciseName: string;
  progressionRate: number; // different from global
  maxIntensity: number; // cap for this exercise
  minDeloadIntensity: number;
  priorityLevel: 'primary' | 'secondary' | 'accessory';
}

// Workout generation with intensity applied
export interface IntensityModifiedWorkout {
  workoutId: string;
  originalDefaults: {
    sets: number;
    reps: string;
    rir?: number;
    weight?: number;
  };
  modifiedDefaults: {
    sets: number;
    reps: string;
    rir?: number;
    weight?: number;
    intensity: number;
  };
  weekNumber: number;
  intensityLabel: string;
}

// Analytics and tracking
export interface ProgressionAnalytics {
  adherenceRate: number; // % of planned vs actual
  avgIntensityAchieved: number;
  fatigueScore: number; // calculated from RPE/RIR data
  recommendedAdjustment: 'increase' | 'maintain' | 'reduce';
  nextWeekSuggestions: Partial<IntensityParameters>;
}

export const DEFAULT_INTENSITY: IntensityParameters = {
  volume: 100,
  weight: 100,
  rir: 2,
  rpe: 7,
  sets: 1.0,
  repsModifier: 1.0,
};

export const DELOAD_INTENSITY: IntensityParameters = {
  volume: 70,
  weight: 85,
  rir: 4,
  rpe: 5,
  sets: 0.7,
  repsModifier: 1.0,
};
