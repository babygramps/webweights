'use client';

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
  onExerciseSelect?: (exerciseId: string) => Promise<ExerciseProgressData[]>;
}

export function ExerciseStats({
  exercises,
  onExerciseSelect,
}: ExerciseStatsProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [progressData, setProgressData] = useState<ExerciseProgressData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExerciseChange = async (exerciseId: string) => {
    console.log(`[ExerciseStats] Exercise selected: ${exerciseId}`);
    setSelectedExercise(exerciseId);

    if (onExerciseSelect && exerciseId) {
      setLoading(true);
      try {
        const data = await onExerciseSelect(exerciseId);
        console.log(
          `[ExerciseStats] Loaded ${data.length} progress data points`,
        );
        setProgressData(data);
      } catch (error) {
        console.error('[ExerciseStats] Error loading exercise data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const selectedExerciseData = exercises.find((e) => e.id === selectedExercise);

  // Calculate stats from progress data
  const stats =
    progressData.length > 0
      ? {
          maxWeight: Math.max(...progressData.map((d) => d.weight)),
          maxReps: Math.max(...progressData.map((d) => d.reps)),
          maxVolume: Math.max(...progressData.map((d) => d.volume)),
          totalSets: progressData.length,
          recentWeight: progressData[progressData.length - 1]?.weight || 0,
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
        <CardTitle>Exercise Progress Tracker</CardTitle>
        <CardDescription>
          Select an exercise to view detailed progress and statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exercise Selector */}
        <div>
          <label
            htmlFor="exercise-select"
            className="text-sm font-medium mb-2 block"
          >
            Choose Exercise
          </label>
          <Select value={selectedExercise} onValueChange={handleExerciseChange}>
            <SelectTrigger id="exercise-select" className="w-full">
              <SelectValue placeholder="Select an exercise to view stats" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                  <span className="text-muted-foreground text-sm ml-2">
                    ({exercise.primaryMuscle})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exercise Details and Stats */}
        {selectedExercise && selectedExerciseData && (
          <div className="space-y-6">
            {/* Exercise Info */}
            <div className="p-4 bg-secondary/20 rounded-lg">
              <h3 className="font-semibold text-lg">
                {selectedExerciseData.name}
              </h3>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>Type: {selectedExerciseData.type}</span>
                <span>
                  Primary Muscle: {selectedExerciseData.primaryMuscle}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : progressData.length > 0 ? (
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
                      value={`${stats?.maxWeight} lbs`}
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
                            {stats?.recentWeight} lbs
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
                    data={progressData}
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
