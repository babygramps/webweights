export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchStats } from '@/lib/api/stats';
import {
  mapPersonalRecords,
  mapMuscleGroups,
  calculateSummaryStats,
} from '@/lib/utils/stats-utils';
import type { RawPersonalRecord, RawMuscleGroup } from '@/lib/types/stats';
import { StatsPageClient } from './StatsPageClient';
import { logger } from '@/lib/logger';

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  logger.info(`[StatsPage] Loading stats for user ${user.id}`);
  const data = await fetchStats(user.id);

  const personalRecords = mapPersonalRecords(
    data.personalRecords as RawPersonalRecord[],
  );
  const muscleDistribution = mapMuscleGroups(
    data.muscleDistribution as RawMuscleGroup[],
  );
  const { totalVolume, avgSetsPerWorkout } = calculateSummaryStats(
    data.recentWorkouts,
  );

  logger.info(`[StatsPage] Stats loaded for user ${user.id}`);

  return (
    <StatsPageClient
      recentWorkouts={data.recentWorkouts}
      personalRecords={personalRecords}
      volumeData={data.volumeData}
      muscleDistribution={muscleDistribution}
      completionRate={data.completionRate}
      userExercises={data.userExercises}
      totalVolume={totalVolume}
      avgSetsPerWorkout={avgSetsPerWorkout}
    />
  );
}
