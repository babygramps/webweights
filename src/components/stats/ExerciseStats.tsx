'use client';
import logger from '@/lib/logger';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from './StatsCard';
import { Trophy, TrendingUp, Dumbbell, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fetchExerciseProgressData } from '@/lib/utils/stats-api';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';

interface Exercise {
  id: string;
  name: string;
  type: string;
  primaryMuscle: string;
}

interface ExerciseProgressData {
  date: Date | string;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  volume: number;
}

interface ExerciseStatsProps {
  exercises: Exercise[];
}

export function ExerciseStats({ exercises }: ExerciseStatsProps) {
  const { weightUnit, convertWeight } = useUserPreferences();
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [progressData, setProgressData] = useState<ExerciseProgressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExerciseChange = async (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setError(null);

    if (exerciseId) {
      setLoading(true);
      try {
        const data = await fetchExerciseProgressData(exerciseId);
        setProgressData(data || []);
      } catch (error) {
        logger.error('[ExerciseStats] Error loading exercise data:', error);
        logger.error('[ExerciseStats] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack available',
          exerciseId,
        });

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load exercise data',
        );
        setProgressData([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const selectedExerciseData = exercises.find((e) => e.id === selectedExercise);

  // Calculate stats from progress data with proper unit conversion
  const stats =
    progressData.length > 0
      ? {
          maxWeight: Math.max(
            ...progressData.map((d) => convertWeight(d.weight)),
          ),
          maxReps: Math.max(...progressData.map((d) => d.reps)),
          maxVolume: Math.max(
            ...progressData.map((d) => convertWeight(d.volume)),
          ),
          totalSets: progressData.length,
          recentWeight: convertWeight(
            progressData[progressData.length - 1]?.weight || 0,
          ),
          recentReps: progressData[progressData.length - 1]?.reps || 0,
          firstSet: progressData[0]?.date
            ? new Date(progressData[0].date)
            : null,
          lastSet: progressData[progressData.length - 1]?.date
            ? new Date(progressData[progressData.length - 1].date)
            : null,
        }
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Analysis</CardTitle>
        <CardDescription>
          Deep dive into your performance for specific exercises
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select Exercise
          </label>
          <Select value={selectedExercise} onValueChange={handleExerciseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an exercise to analyze" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.primaryMuscle})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading exercise data...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-medium text-destructive mb-2">
              Error Loading Data
            </h4>
            <p className="text-sm text-destructive/80">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please try selecting a different exercise or refresh the page.
            </p>
          </div>
        )}

        {selectedExerciseData && !loading && !error && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedExerciseData.name}
              </h3>
              <span className="text-sm text-muted-foreground">
                {selectedExerciseData.primaryMuscle} •{' '}
                {selectedExerciseData.type}
              </span>
            </div>

            {progressData.length > 0 ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="progress">Progress Chart</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                      title="Max Weight"
                      value={`${stats?.maxWeight} ${weightUnit}`}
                      description="Personal record"
                      icon={Trophy}
                    />
                    <StatsCard
                      title="Max Reps"
                      value={stats?.maxReps || 0}
                      description="Single set record"
                      icon={TrendingUp}
                    />
                    <StatsCard
                      title="Total Sets"
                      value={stats?.totalSets || 0}
                      description="All time"
                      icon={Dumbbell}
                    />
                    <StatsCard
                      title="Last Performed"
                      value={
                        stats?.lastSet ? format(stats.lastSet, 'MMM d') : 'N/A'
                      }
                      description={
                        stats?.lastSet ? format(stats.lastSet, 'yyyy') : ''
                      }
                      icon={Calendar}
                    />
                  </div>

                  {/* Recent Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Recent Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Last Weight
                          </p>
                          <p className="text-2xl font-bold">
                            {stats?.recentWeight} {weightUnit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Last Reps
                          </p>
                          <p className="text-2xl font-bold">
                            {stats?.recentReps}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="progress">
                  <ExerciseProgressChart
                    exerciseName={selectedExerciseData.name}
                    data={progressData.map((d) => ({
                      ...d,
                      weight: convertWeight(d.weight),
                      volume: convertWeight(d.volume),
                    }))}
                    showVolume={true}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this exercise yet. Start logging sets to
                see progress!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
