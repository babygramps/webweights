import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  getRecentWorkouts,
  getPersonalRecords,
  getVolumeProgressData,
  getMuscleGroupDistribution,
  getWorkoutCompletionRate,
} from '@/db/queries/stats';
import { StatsPageClient } from './StatsPageClient';

type RecentWorkout = {
  workoutId: string;
  workoutDate: string;
  workoutLabel: string | null;
  mesocycleTitle: string;
  setCount: number;
  totalVolume: number;
};

type PersonalRecord = {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  exerciseName: string;
};

type MuscleGroup = {
  primaryMuscle: string;
  setCount: number;
  totalVolume: number;
};

export default async function StatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  console.log(`[StatsPage] Loading stats for user: ${user.id}`);

  // Fetch all stats data
  const [
    recentWorkouts,
    personalRecords,
    volumeData,
    muscleDistribution,
    completionRate,
  ] = await Promise.all([
    getRecentWorkouts(user.id, 5),
    getPersonalRecords(user.id),
    getVolumeProgressData(user.id),
    getMuscleGroupDistribution(user.id),
    getWorkoutCompletionRate(user.id),
  ]);

  // Calculate some additional stats
  const totalWorkouts = recentWorkouts.length;
  const totalVolume = recentWorkouts.reduce(
    (sum: number, w: RecentWorkout) => sum + (Number(w.totalVolume) || 0),
    0,
  );
  const avgSetsPerWorkout =
    totalWorkouts > 0
      ? Math.round(
          recentWorkouts.reduce(
            (sum: number, w: RecentWorkout) => sum + (Number(w.setCount) || 0),
            0,
          ) / totalWorkouts,
        )
      : 0;

  console.log(
    `[StatsPage] Loaded ${personalRecords.length} PRs, ${volumeData.length} volume data points`,
  );

  // Map personalRecords to ensure correct types
  const safePersonalRecords: PersonalRecord[] = personalRecords.map((pr) => ({
    exerciseId: pr.exerciseId,
    weight: pr.weight ? Number(pr.weight) : 0,
    reps: pr.reps ? Number(pr.reps) : 0,
    date: pr.date
      ? typeof pr.date === 'string'
        ? pr.date
        : new Date(pr.date).toISOString()
      : '',
    exerciseName: pr.exerciseName,
  }));

  // Map muscleDistribution to ensure correct types
  const safeMuscleDistribution: MuscleGroup[] = muscleDistribution.map(
    (m: {
      primaryMuscle: string | null;
      setCount: number;
      totalVolume: number;
    }) => ({
      primaryMuscle: m.primaryMuscle ?? 'Other',
      setCount: m.setCount,
      totalVolume: m.totalVolume,
    }),
  );

  return (
    <StatsPageClient
      recentWorkouts={recentWorkouts}
      personalRecords={safePersonalRecords}
      volumeData={volumeData}
      muscleDistribution={safeMuscleDistribution}
      completionRate={completionRate}
      totalVolume={totalVolume}
      avgSetsPerWorkout={avgSetsPerWorkout}
    />
  );
}
