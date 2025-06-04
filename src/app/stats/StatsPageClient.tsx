'use client';

import { StatsCard } from '@/components/stats/StatsCard';
import { PRCard } from '@/components/stats/PRCard';
import { ProgressChart } from '@/components/stats/ProgressChart';
import { MuscleGroupChart } from '@/components/stats/MuscleGroupChart';
import { OneRMCalculator } from '@/components/stats/OneRMCalculator';
import { ExerciseStats } from '@/components/stats/ExerciseStats';
import { StatsFilters } from '@/components/stats/StatsFilters';
import { OneRMProgressChart } from '@/components/stats/OneRMProgressChart';
import { fetchExerciseProgressData } from '@/lib/utils/stats-api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, Trophy, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import { isDateInRange, filterPersonalRecords } from '@/lib/utils/stats-filter';
import type {
  RecentWorkout,
  PersonalRecord,
  VolumeData,
  MuscleGroup,
  CompletionRate,
  UserExercise,
  WeeklyCompletion,
} from '@/lib/types/stats';

interface StatsPageClientProps {
  recentWorkouts: RecentWorkout[];
  personalRecords: PersonalRecord[];
  volumeData: VolumeData[];
  muscleDistribution: MuscleGroup[];
  completionRate: CompletionRate;
  userExercises: UserExercise[];
  weeklyCompletion: WeeklyCompletion[];
  totalVolume: number;
  avgSetsPerWorkout: number;
}

interface ExerciseProgressData {
  date: string | Date;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  volume: number;
}

export function StatsPageClient({
  recentWorkouts,
  personalRecords,
  volumeData,
  muscleDistribution,
  completionRate,
  userExercises,
  weeklyCompletion,
  totalVolume,
  avgSetsPerWorkout,
}: StatsPageClientProps) {
  const { weightUnit, convertWeight } = useUserPreferences();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedExercise, setSelectedExercise] = useState<
    string | undefined
  >();
  const [selectedMuscle, setSelectedMuscle] = useState<string | undefined>();
  const [exerciseProgress, setExerciseProgress] = useState<
    ExerciseProgressData[]
  >([]);

  const muscleGroups = useMemo(
    () => Array.from(new Set(muscleDistribution.map((m) => m.primaryMuscle))),
    [muscleDistribution],
  );

  const filteredRecentWorkouts = useMemo(
    () => recentWorkouts.filter((w) => isDateInRange(w.workoutDate, dateRange)),
    [recentWorkouts, dateRange],
  );

  const filteredVolumeData = useMemo(
    () => volumeData.filter((d) => isDateInRange(d.date, dateRange)),
    [volumeData, dateRange],
  );

  const filteredWeeklyCompletion = useMemo(
    () => weeklyCompletion.filter((d) => isDateInRange(d.week, dateRange)),
    [weeklyCompletion, dateRange],
  );

  const filteredMuscleDistribution = useMemo(() => {
    return muscleDistribution.filter((m) =>
      selectedMuscle ? m.primaryMuscle === selectedMuscle : true,
    );
  }, [muscleDistribution, selectedMuscle]);

  const filteredPersonalRecords = useMemo(
    () =>
      filterPersonalRecords(personalRecords, {
        range: dateRange,
        exerciseId: selectedExercise,
        muscle: selectedMuscle,
        userExercises,
      }),
    [
      personalRecords,
      selectedExercise,
      selectedMuscle,
      userExercises,
      dateRange,
    ],
  );

  const filteredExerciseProgress = useMemo(
    () => exerciseProgress.filter((d) => isDateInRange(d.date, dateRange)),
    [exerciseProgress, dateRange],
  );

  useEffect(() => {
    if (!selectedExercise) {
      setExerciseProgress([]);
      return;
    }

    fetchExerciseProgressData(selectedExercise)
      .then((data) => setExerciseProgress(data || []))
      .catch(() => setExerciseProgress([]));
  }, [selectedExercise]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Training Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress and analyze your training patterns
        </p>
      </div>

      <StatsFilters
        onDateRangeChange={setDateRange}
        onExerciseChange={setSelectedExercise}
        onMuscleGroupChange={setSelectedMuscle}
        exercises={userExercises.map((ex) => ({ id: ex.id, name: ex.name }))}
        muscleGroups={muscleGroups}
      />

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
              {filteredPersonalRecords.slice(0, 6).map((pr) => (
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
              {filteredRecentWorkouts.map((workout) => (
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

        <TabsContent value="exercises" className="space-y-6">
          <ExerciseStats
            exercises={userExercises.map((ex) => ({
              id: ex.id,
              name: ex.name,
              type: ex.type || 'Unknown',
              primaryMuscle: ex.primaryMuscle || 'Unknown',
            }))}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Volume Progress Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgressChart
              title="Volume Progress"
              description="Total training volume over time"
              data={filteredVolumeData.map((d) => ({
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
              data={filteredMuscleDistribution}
              title="Training Focus"
              description="Volume distribution by muscle group"
              dataKey="totalVolume"
            />
          </div>

          <ProgressChart
            title="Weekly Adherence"
            description="Completion rate by week"
            data={filteredWeeklyCompletion.map((d) => ({
              date: d.week,
              adherence: Number(d.completionRate) || 0,
            }))}
            dataKey="adherence"
            xAxisKey="date"
            yAxisLabel="Completion %"
            chartType="line"
            color="#10b981"
          />

          {/* Sets & Intensity Trends */}
          <ProgressChart
            title="Training Frequency"
            description="Number of sets performed over time"
            data={filteredVolumeData.map((d) => ({
              date: d.date,
              sets: Number(d.totalSets) || 0,
            }))}
            dataKey="sets"
            xAxisKey="date"
            yAxisLabel="Total Sets"
            chartType="line"
            color="#3b82f6"
          />

          {selectedExercise && filteredExerciseProgress.length > 0 && (
            <OneRMProgressChart
              exerciseName={
                userExercises.find((e) => e.id === selectedExercise)?.name || ''
              }
              sets={filteredExerciseProgress}
            />
          )}
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
