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
    userExercises,
  ] = await Promise.all([
    getRecentWorkouts(user.id, 5),
    getPersonalRecords(user.id),
    getVolumeProgressData(user.id),
    getMuscleGroupDistribution(user.id),
    getWorkoutCompletionRate(user.id),
    getUserExercises(user.id),
  ]);

  // Calculate some additional stats
  const totalWorkouts = recentWorkouts.length;
  const totalVolume = recentWorkouts.reduce(
    (sum: number, w: (typeof recentWorkouts)[0]) =>
      sum + (Number(w.totalVolume) || 0),
    0,
  );
  const avgSetsPerWorkout =
    totalWorkouts > 0
      ? Math.round(
          recentWorkouts.reduce(
            (sum: number, w: (typeof recentWorkouts)[0]) =>
              sum + (Number(w.setCount) || 0),
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
              value={completionRate.completedWorkouts}
              description="Logged sessions"
              icon={Activity}
            />
            <StatsCard
              title="Completion Rate"
              value={`${completionRate.completionRate.toFixed(0)}%`}
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
              {safePersonalRecords.slice(0, 6).map((pr: PersonalRecord) => (
                <PRCard
                  key={pr.exerciseId}
                  exerciseName={pr.exerciseName}
                  weight={pr.weight}
                  reps={pr.reps}
                  date={pr.date || new Date()}
                />
              ))}
            </div>
          </div>

          {/* Recent Workouts */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Workouts</h2>
            <div className="space-y-3">
              {recentWorkouts.map((workout: (typeof recentWorkouts)[0]) => (
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
                        {((workout.totalVolume || 0) / 1000).toFixed(1)}k lbs
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-6">
          <ExerciseStats
            exercises={userExercises.map((ex) => ({
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
              data={volumeData.map((d: VolumeData) => ({
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
              data={safeMuscleDistribution}
              title="Training Focus"
              description="Volume distribution by muscle group"
              dataKey="totalVolume"
            />
          </div>

          {/* Sets & Intensity Trends */}
          <ProgressChart
            title="Training Frequency"
            description="Number of sets performed over time"
            data={volumeData.map((d: VolumeData) => ({
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
              <p className="text-lg font-medium mb-2">More Tools Coming Soon</p>
              <p className="text-sm">
                RPE/RIR converter, Volume calculator, and more analytical tools
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
