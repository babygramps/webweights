export interface RecentWorkout {
  workoutId: string;
  workoutDate: string;
  workoutLabel: string | null;
  mesocycleTitle: string;
  setCount: number;
  totalVolume: number;
  weekNumber?: number | null;
}

export interface WeightRecord {
  weight: number;
  reps: number;
  date: string;
}

export interface VolumeRecord {
  volume: number;
  date: string;
}

export interface RepsRecord {
  reps: number;
  date: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: WeightRecord | null;
  maxVolume: VolumeRecord | null;
  maxReps: RepsRecord | null;
}

export interface VolumeData {
  date: string;
  totalVolume: number;
  totalSets: number;
  avgIntensity: number;
}

export interface MuscleGroup {
  primaryMuscle: string;
  setCount: number;
  totalVolume: number;
}

export interface RawMuscleGroup {
  primaryMuscle: string | null;
  setCount: number;
  totalVolume: number;
}

export interface CompletionRate {
  completedWorkouts: number;
  completionRate: number;
}

export interface UserExercise {
  id: string;
  name: string;
  type: string | null;
  primaryMuscle: string | null;
}

export interface RawPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight?: { weight: number; reps: number; date: string | Date } | null;
  maxVolume?: { volume: number; date: string | Date } | null;
  maxReps?: { reps: number; date: string | Date } | null;
}

export interface WeeklyCompletion {
  week: string;
  completedWorkouts: number;
  totalWorkouts: number;
  completionRate: number;
}
