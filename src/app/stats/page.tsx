export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  getRecentWorkouts,
  getPersonalRecords,
  getVolumeProgressData,
  getMuscleGroupDistribution,
  getWorkoutCompletionRate,
  getUserExercises,
} from '@/db/queries/stats';

import { fetchExerciseProgress } from './actions';
import { StatsCard } from '@/components/stats/StatsCard';
import { PRCard } from '@/components/stats/PRCard';
import { ProgressChart } from '@/components/stats/ProgressChart';
import { MuscleGroupChart } from '@/components/stats/MuscleGroupChart';
import { OneRMCalculator } from '@/components/stats/OneRMCalculator';
import { ExerciseStats } from '@/components/stats/ExerciseStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, Trophy, Target } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { VolumeData } from './StatsPageClient';

type WeightRecord = {
  weight: number;
  reps: number;
  date: string;
};

type VolumeRecord = {
  volume: number;
  date: string;
};

type RepsRecord = {
  reps: number;
  date: string;
};

type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  maxWeight: WeightRecord | null;
  maxVolume: VolumeRecord | null;
  maxReps: RepsRecord | null;
};

type MuscleGroup = {
  primaryMuscle: string;
  setCount: number;
  totalVolume: number;
};

export default async function StatsPage() {
  // Add comprehensive logging for debugging production issues
  console.log('🔍 [StatsPage] Starting page load');
  console.log('Environment Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
    SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ALL_ENV_KEYS: Object.keys(process.env).filter(
      (key) => key.includes('DATABASE') || key.includes('SUPABASE'),
    ),
  });

  try {
    const supabase = await createClient();
    console.log('✅ [StatsPage] Supabase client created successfully');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ [StatsPage] No authenticated user, redirecting');
      redirect('/');
    }

    console.log(`✅ [StatsPage] Loading stats for user: ${user.id}`);

    // Test database connection with error handling
    try {
      console.log('🔍 [StatsPage] Testing database connection...');

      // Fetch all stats data with individual error handling
      const [
        recentWorkouts,
        personalRecords,
        volumeData,
        muscleDistribution,
        completionRate,
        userExercises,
      ] = await Promise.allSettled([
        getRecentWorkouts(user.id, 5),
        getPersonalRecords(user.id),
        getVolumeProgressData(user.id),
        getMuscleGroupDistribution(user.id),
        getWorkoutCompletionRate(user.id),
        getUserExercises(user.id),
      ]);

      // Log results of each query
      console.log('📊 [StatsPage] Query results:', {
        recentWorkouts: recentWorkouts.status,
        personalRecords: personalRecords.status,
        volumeData: volumeData.status,
        muscleDistribution: muscleDistribution.status,
        completionRate: completionRate.status,
        userExercises: userExercises.status,
      });

      // Handle failed queries
      const failedQueries = [
        { name: 'recentWorkouts', result: recentWorkouts },
        { name: 'personalRecords', result: personalRecords },
        { name: 'volumeData', result: volumeData },
        { name: 'muscleDistribution', result: muscleDistribution },
        { name: 'completionRate', result: completionRate },
        { name: 'userExercises', result: userExercises },
      ].filter(({ result }) => result.status === 'rejected');

      if (failedQueries.length > 0) {
        console.error(
          '❌ [StatsPage] Failed queries:',
          failedQueries.map(({ name, result }) => ({
            name,
            error: result.status === 'rejected' ? result.reason : null,
          })),
        );

        // Show error page with details
        throw new Error(
          `Failed to load stats data: ${failedQueries.map((q) => q.name).join(', ')}`,
        );
      }

      // Extract successful results
      const safeRecentWorkouts =
        recentWorkouts.status === 'fulfilled' ? recentWorkouts.value : [];
      const safePersonalRecords =
        personalRecords.status === 'fulfilled' ? personalRecords.value : [];
      const safeVolumeData =
        volumeData.status === 'fulfilled' ? volumeData.value : [];
      const safeMuscleDistribution =
        muscleDistribution.status === 'fulfilled'
          ? muscleDistribution.value
          : [];
      const safeCompletionRate =
        completionRate.status === 'fulfilled'
          ? completionRate.value
          : { completedWorkouts: 0, completionRate: 0 };
      const safeUserExercises =
        userExercises.status === 'fulfilled' ? userExercises.value : [];

      console.log(
        `✅ [StatsPage] Successfully loaded ${safePersonalRecords.length} PRs, ${safeVolumeData.length} volume data points`,
      );

      // Calculate some additional stats
      const totalWorkouts = safeRecentWorkouts.length;
      const totalVolume = safeRecentWorkouts.reduce(
        (sum: number, w: (typeof safeRecentWorkouts)[0]) =>
          sum + (Number(w.totalVolume) || 0),
        0,
      );
      const avgSetsPerWorkout =
        totalWorkouts > 0
          ? Math.round(
              safeRecentWorkouts.reduce(
                (sum: number, w: (typeof safeRecentWorkouts)[0]) =>
                  sum + (Number(w.setCount) || 0),
                0,
              ) / totalWorkouts,
            )
          : 0;

      // Map personalRecords to ensure correct types
      const mappedPersonalRecords: PersonalRecord[] = safePersonalRecords.map(
        (pr) => ({
          exerciseId: pr.exerciseId,
          exerciseName: pr.exerciseName,
          maxWeight: pr.maxWeight
            ? {
                weight: Number(pr.maxWeight.weight) || 0,
                reps: Number(pr.maxWeight.reps) || 0,
                date: pr.maxWeight.date
                  ? typeof pr.maxWeight.date === 'string'
                    ? pr.maxWeight.date
                    : new Date(pr.maxWeight.date).toISOString()
                  : '',
              }
            : null,
          maxVolume: pr.maxVolume
            ? {
                volume: Number(pr.maxVolume.volume) || 0,
                date: pr.maxVolume.date
                  ? typeof pr.maxVolume.date === 'string'
                    ? pr.maxVolume.date
                    : new Date(pr.maxVolume.date).toISOString()
                  : '',
              }
            : null,
          maxReps: pr.maxReps
            ? {
                reps: Number(pr.maxReps.reps) || 0,
                date: pr.maxReps.date
                  ? typeof pr.maxReps.date === 'string'
                    ? pr.maxReps.date
                    : new Date(pr.maxReps.date).toISOString()
                  : '',
              }
            : null,
        }),
      );

      // Map muscleDistribution to ensure correct types
      const mappedMuscleDistribution: MuscleGroup[] =
        safeMuscleDistribution.map(
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
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Training Analytics</h1>
            <p className="text-muted-foreground">
              Track your progress and analyze your training patterns
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Workouts"
                  value={safeCompletionRate.completedWorkouts}
                  description="Logged sessions"
                  icon={Activity}
                />
                <StatsCard
                  title="Completion Rate"
                  value={`${safeCompletionRate.completionRate.toFixed(0)}%`}
                  description="Workout adherence"
                  icon={Target}
                />
                <StatsCard
                  title="Total Volume"
                  value={`${(totalVolume / 1000).toFixed(1)}k`}
                  description="Pounds lifted this month"
                  icon={TrendingUp}
                />
                <StatsCard
                  title="Avg Sets/Workout"
                  value={avgSetsPerWorkout}
                  description="Average workout volume"
                  icon={Trophy}
                />
              </div>

              {/* Personal Records */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Personal Records</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mappedPersonalRecords
                    .slice(0, 6)
                    .map((pr: PersonalRecord) => (
                      <PRCard
                        key={pr.exerciseId}
                        exerciseName={pr.exerciseName}
                        maxWeight={pr.maxWeight}
                        maxVolume={pr.maxVolume}
                        maxReps={pr.maxReps}
                      />
                    ))}
                </div>
              </div>

              {/* Recent Workouts */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Recent Workouts</h2>
                <div className="space-y-3">
                  {safeRecentWorkouts.map(
                    (workout: (typeof safeRecentWorkouts)[0]) => (
                      <div
                        key={workout.workoutId}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {workout.workoutLabel || 'Workout'} -{' '}
                                {workout.mesocycleTitle}
                              </h3>
                              {workout.weekNumber && (
                                <Badge variant="secondary" className="text-xs">
                                  Week {workout.weekNumber}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(workout.workoutDate),
                                'EEEE, MMM d, yyyy',
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {workout.setCount || 0} sets
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {((workout.totalVolume || 0) / 1000).toFixed(1)}k
                              lbs
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exercises" className="space-y-6">
              <ExerciseStats
                exercises={safeUserExercises.map((ex) => ({
                  id: ex.id,
                  name: ex.name,
                  type: ex.type || 'Unknown',
                  primaryMuscle: ex.primaryMuscle || 'Unknown',
                }))}
                onExerciseSelect={fetchExerciseProgress}
              />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              {/* Volume Progress Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProgressChart
                  title="Volume Progress"
                  description="Total training volume over time"
                  data={safeVolumeData.map((d: VolumeData) => ({
                    date: d.date,
                    volume: Number(d.totalVolume) || 0,
                  }))}
                  dataKey="volume"
                  xAxisKey="date"
                  yAxisLabel="Volume (lbs)"
                  chartType="bar"
                  color="#8b5cf6"
                  tooltipFormat="kilo"
                />

                <MuscleGroupChart
                  data={mappedMuscleDistribution}
                  title="Training Focus"
                  description="Volume distribution by muscle group"
                  dataKey="totalVolume"
                />
              </div>

              {/* Sets & Intensity Trends */}
              <ProgressChart
                title="Training Frequency"
                description="Number of sets performed over time"
                data={safeVolumeData.map((d: VolumeData) => ({
                  date: d.date,
                  sets: Number(d.totalSets) || 0,
                }))}
                dataKey="sets"
                xAxisKey="date"
                yAxisLabel="Total Sets"
                chartType="line"
                color="#3b82f6"
              />
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OneRMCalculator />

                {/* Placeholder for future tools */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">
                    More Tools Coming Soon
                  </p>
                  <p className="text-sm">
                    RPE/RIR converter, Volume calculator, and more analytical
                    tools
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
    } catch (dbError) {
      console.error('❌ [StatsPage] Database operation failed:', dbError);
      console.error(
        'Stack trace:',
        dbError instanceof Error ? dbError.stack : 'No stack trace available',
      );

      // Return a fallback UI instead of crashing
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Database Connection Error
            </h1>
            <p className="text-muted-foreground mb-4">
              Unable to load your training statistics. Please check your
              database configuration.
            </p>
            <div className="bg-muted p-4 rounded-lg text-left max-w-2xl mx-auto">
              <h3 className="font-semibold mb-2">Error Details:</h3>
              <pre className="text-sm overflow-auto bg-background p-2 rounded border">
                {dbError instanceof Error ? dbError.message : String(dbError)}
              </pre>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Environment Debug Info:</h4>
                <pre className="text-xs bg-background p-2 rounded border overflow-auto">
                  {JSON.stringify(
                    {
                      NODE_ENV: process.env.NODE_ENV,
                      DATABASE_URL_SET: !!process.env.DATABASE_URL,
                      DATABASE_URL_LENGTH:
                        process.env.DATABASE_URL?.length || 0,
                      AVAILABLE_ENV_VARS: Object.keys(process.env).filter(
                        (key) =>
                          key.includes('DATABASE') || key.includes('SUPABASE'),
                      ),
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('❌ [StatsPage] Page load failed:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace available',
    );

    throw error; // Re-throw to trigger Next.js error boundary
  }
}
