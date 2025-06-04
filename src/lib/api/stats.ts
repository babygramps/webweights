import {
  getRecentWorkouts,
  getPersonalRecords,
  getVolumeProgressData,
  getMuscleGroupDistribution,
  getWorkoutCompletionRate,
  getUserExercises,
} from '@/db/queries/stats';
import { logger } from '@/lib/logger';
import type {
  CompletionRate,
  RecentWorkout,
  UserExercise,
  VolumeData,
} from '@/lib/types/stats';

export interface StatsData {
  recentWorkouts: RecentWorkout[];
  personalRecords: unknown[];
  volumeData: VolumeData[];
  muscleDistribution: unknown[];
  completionRate: CompletionRate;
  userExercises: UserExercise[];
}

export async function fetchStats(userId: string): Promise<StatsData> {
  const [
    recentWorkouts,
    personalRecords,
    volumeData,
    muscleDistribution,
    completionRate,
    userExercises,
  ] = await Promise.allSettled([
    getRecentWorkouts(userId, 5),
    getPersonalRecords(userId),
    getVolumeProgressData(userId),
    getMuscleGroupDistribution(userId),
    getWorkoutCompletionRate(userId),
    getUserExercises(userId),
  ]);

  const safe = <T>(res: PromiseSettledResult<T>, fallback: T) => {
    if (res.status === 'fulfilled') return res.value;
    logger.error('Failed to fetch stats:', res.reason);
    return fallback;
  };

  return {
    recentWorkouts: safe(recentWorkouts, [] as RecentWorkout[]),
    personalRecords: safe(personalRecords, [] as unknown[]),
    volumeData: safe(volumeData, [] as VolumeData[]),
    muscleDistribution: safe(muscleDistribution, [] as unknown[]),
    completionRate: safe(completionRate, {
      completedWorkouts: 0,
      completionRate: 0,
    } as CompletionRate),
    userExercises: safe(userExercises, [] as UserExercise[]),
  };
}
