import {
  getRecentWorkouts,
  getPersonalRecords,
  getVolumeProgressData,
  getMuscleGroupDistribution,
  getWorkoutCompletionRate,
  getWeeklyCompletionData,
  getUserExercises,
} from '@/db/queries/stats';
import { logger } from '@/lib/logger';
import type {
  CompletionRate,
  RecentWorkout,
  UserExercise,
  VolumeData,
  WeeklyCompletion,
} from '@/lib/types/stats';

export interface StatsData {
  recentWorkouts: RecentWorkout[];
  personalRecords: unknown[];
  volumeData: VolumeData[];
  muscleDistribution: unknown[];
  completionRate: CompletionRate;
  userExercises: UserExercise[];
  weeklyCompletion: WeeklyCompletion[];
}

export async function fetchStats(userId: string): Promise<StatsData> {
  const [
    recentWorkouts,
    personalRecords,
    volumeData,
    muscleDistribution,
    completionRate,
    weeklyCompletion,
    userExercises,
  ] = await Promise.allSettled([
    getRecentWorkouts(userId, 5),
    getPersonalRecords(userId),
    getVolumeProgressData(userId),
    getMuscleGroupDistribution(userId),
    getWorkoutCompletionRate(userId),
    getWeeklyCompletionData(userId),
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
    weeklyCompletion: safe(weeklyCompletion, [] as WeeklyCompletion[]),
  };
}
