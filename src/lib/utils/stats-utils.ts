import type {
  MuscleGroup,
  PersonalRecord,
  RecentWorkout,
  RawPersonalRecord,
  RawMuscleGroup,
} from '@/lib/types/stats';

function toIso(date: unknown): string {
  if (!date) return '';
  return typeof date === 'string'
    ? date
    : new Date(date as string | number).toISOString();
}

export function mapPersonalRecords(
  records: RawPersonalRecord[],
): PersonalRecord[] {
  return records.map((pr) => ({
    exerciseId: pr.exerciseId,
    exerciseName: pr.exerciseName,
    maxWeight: pr.maxWeight
      ? {
          weight: Number(pr.maxWeight.weight) || 0,
          reps: Number(pr.maxWeight.reps) || 0,
          date: toIso(pr.maxWeight.date),
        }
      : null,
    maxVolume: pr.maxVolume
      ? {
          volume: Number(pr.maxVolume.volume) || 0,
          date: toIso(pr.maxVolume.date),
        }
      : null,
    maxReps: pr.maxReps
      ? {
          reps: Number(pr.maxReps.reps) || 0,
          date: toIso(pr.maxReps.date),
        }
      : null,
  }));
}

export function mapMuscleGroups(data: RawMuscleGroup[]): MuscleGroup[] {
  return data.map((m) => ({
    primaryMuscle: m.primaryMuscle ?? 'Other',
    setCount: m.setCount,
    totalVolume: m.totalVolume,
  }));
}

export function calculateSummaryStats(workouts: RecentWorkout[]) {
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce(
    (sum, w) => sum + (Number(w.totalVolume) || 0),
    0,
  );
  const avgSetsPerWorkout =
    totalWorkouts > 0
      ? Math.round(
          workouts.reduce((sum, w) => sum + (Number(w.setCount) || 0), 0) /
            totalWorkouts,
        )
      : 0;
  return { totalVolume, avgSetsPerWorkout };
}
