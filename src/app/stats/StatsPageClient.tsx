'use client';

import { StatsCard } from '@/components/stats/StatsCard';
import { PRCard } from '@/components/stats/PRCard';
import { ProgressChart } from '@/components/stats/ProgressChart';
import { MuscleGroupChart } from '@/components/stats/MuscleGroupChart';
import { OneRMCalculator } from '@/components/stats/OneRMCalculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, Trophy, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';

interface RecentWorkout {
  workoutId: string;
  workoutDate: string;
  workoutLabel: string | null;
  mesocycleTitle: string;
  setCount: number;
  totalVolume: number;
}

interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  exerciseName: string;
}

interface VolumeData {
  date: string;
  totalVolume: number;
  totalSets: number;
  avgIntensity: number;
}

interface MuscleGroup {
  primaryMuscle: string;
  setCount: number;
  totalVolume: number;
}

interface StatsPageClientProps {
  recentWorkouts: RecentWorkout[];
  personalRecords: PersonalRecord[];
  volumeData: VolumeData[];
  muscleDistribution: MuscleGroup[];
  completionRate: {
    completedWorkouts: number;
    completionRate: number;
  };
  totalVolume: number;
  avgSetsPerWorkout: number;
}

export function StatsPageClient({
  recentWorkouts,
  personalRecords,
  volumeData,
  muscleDistribution,
  completionRate,
  totalVolume,
  avgSetsPerWorkout,
}: StatsPageClientProps) {
  const { weightUnit, convertWeight } = useUserPreferences();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Training Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress and analyze your training patterns
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
              value={`${(convertWeight(totalVolume) / 1000).toFixed(1)}k`}
              description={`${weightUnit} lifted this month`}
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
              {personalRecords.slice(0, 6).map((pr) => (
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
              {recentWorkouts.map((workout) => (
                <div
                  key={workout.workoutId}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {workout.workoutLabel || 'Workout'} -{' '}
                        {workout.mesocycleTitle}
                      </h3>
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
                        {(
                          convertWeight(workout.totalVolume || 0) / 1000
                        ).toFixed(1)}
                        k {weightUnit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Volume Progress Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgressChart
              title="Volume Progress"
              description="Total training volume over time"
              data={volumeData.map((d) => ({
                date: d.date,
                volume: Number(d.totalVolume) || 0,
              }))}
              dataKey="volume"
              xAxisKey="date"
              yAxisLabel={`Volume (${weightUnit})`}
              chartType="bar"
              color="#8b5cf6"
              tooltipFormat="kilo"
            />

            <MuscleGroupChart
              data={muscleDistribution}
              title="Training Focus"
              description="Volume distribution by muscle group"
              dataKey="totalVolume"
            />
          </div>

          {/* Sets & Intensity Trends */}
          <ProgressChart
            title="Training Frequency"
            description="Number of sets performed over time"
            data={volumeData.map((d) => ({
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
