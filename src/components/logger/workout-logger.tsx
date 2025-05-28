'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SetLogger } from './set-logger';
import { RestTimer } from './rest-timer';
import { ExerciseSelector } from './exercise-selector';
import { format } from 'date-fns';
import { SetsList } from './SetsList';

interface Workout {
  id: string;
  scheduled_for: string;
  label: string;
  mesocycle_id: string;
  workout_exercises?: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  order_idx: number;
  defaults: {
    sets?: number;
    reps?: string;
    rir?: number;
    rest?: string;
  };
  exercise: Exercise;
}

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscle: string;
}

interface LoggedSet {
  id?: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  rest?: string;
  is_myo_rep?: boolean;
  is_partial?: boolean;
  myo_rep_count?: number;
  partial_count?: number;
}

export function WorkoutLogger({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] =
    useState<WorkoutExercise | null>(null);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchWorkout();
    fetchLoggedSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  const fetchWorkout = async () => {
    try {
      console.log('Fetching workout:', workoutId);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('workouts')
        .select(
          `
          *,
          workout_exercises (
            *,
            exercise:exercises (*)
          )
        `,
        )
        .eq('id', workoutId)
        .single();

      if (error) {
        console.error('Error fetching workout:', error);
        throw error;
      }

      console.log('Fetched workout:', data);
      setWorkout(data);

      // Select first exercise by default
      if (data.workout_exercises && data.workout_exercises.length > 0) {
        const sortedExercises = data.workout_exercises.sort(
          (a: WorkoutExercise, b: WorkoutExercise) =>
            (a.order_idx || 0) - (b.order_idx || 0),
        );
        setSelectedExercise(sortedExercises[0]);
      }
    } catch (err) {
      console.error('Failed to fetch workout:', err);
      toast.error('Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoggedSets = async () => {
    try {
      console.log('Fetching logged sets for workout:', workoutId);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('sets_logged')
        .select('*')
        .eq('workout_id', workoutId)
        .order('logged_at', { ascending: true });

      if (error) {
        console.error('Error fetching logged sets:', error);
        throw error;
      }

      console.log('Fetched logged sets:', data);
      setLoggedSets(data || []);
    } catch (err) {
      console.error('Failed to fetch logged sets:', err);
    }
  };

  const handleLogSet = async (
    exerciseId: string,
    setData: Omit<LoggedSet, 'workout_id' | 'exercise_id'>,
  ) => {
    if (!selectedExercise) return;

    const newSet: LoggedSet = {
      ...setData,
      workout_id: workoutId,
      exercise_id: exerciseId,
    };

    try {
      console.log('Logging set:', newSet);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('sets_logged')
        .insert(newSet)
        .select()
        .single();

      if (error) {
        console.error('Error logging set:', error);
        throw error;
      }

      console.log('Logged set successfully:', data);
      setLoggedSets([...loggedSets, data]);
      toast.success('Set logged!');
    } catch (err) {
      console.error('Failed to log set:', err);
      toast.error('Failed to log set');
    }
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (!workout) return;

    try {
      console.log('Adding exercise to workout:', exerciseId);
      const supabase = createClient();

      // Get the next order index
      const maxOrderIdx =
        workout.workout_exercises?.reduce(
          (max, ex) => Math.max(max, ex.order_idx || 0),
          0,
        ) || 0;

      const { error } = await supabase.from('workout_exercises').insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        order_idx: maxOrderIdx + 1,
        defaults: {
          sets: 3,
          reps: '8-12',
          rest: '2:00',
        },
      });

      if (error) {
        console.error('Error adding exercise:', error);
        throw error;
      }

      console.log('Added exercise successfully');
      toast.success('Exercise added!');
      setIsAddingExercise(false);
      fetchWorkout(); // Refresh workout data
    } catch (err) {
      console.error('Failed to add exercise:', err);
      toast.error('Failed to add exercise');
    }
  };

  const handleFinishWorkout = async () => {
    setIsSaving(true);
    try {
      // In the future, we could update workout status or calculate summary stats
      toast.success('Workout completed!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to finish workout:', err);
      toast.error('Failed to complete workout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSet = async (
    setId: string,
    updates: {
      weight?: number;
      reps?: number;
      rir?: number | null;
      rpe?: number | null;
      isMyoRep?: boolean;
      isPartial?: boolean;
      myoRepCount?: number;
      partialCount?: number;
    },
  ) => {
    console.log(`Updating set ${setId} with:`, updates);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('sets_logged')
        .update({
          weight: updates.weight?.toString(),
          reps: updates.reps,
          rir: updates.rir,
          rpe: updates.rpe,
          is_myo_rep: updates.isMyoRep,
          is_partial: updates.isPartial,
          myo_rep_count: updates.myoRepCount,
          partial_count: updates.partialCount,
        })
        .eq('id', setId)
        .select()
        .single();

      if (error) {
        console.error('Error updating set:', error);
        throw error;
      }

      console.log('Set updated successfully:', data);
      // Refresh the sets
      await fetchLoggedSets();
    } catch (error) {
      console.error('Failed to update set:', error);
      throw error;
    }
  };

  const handleDeleteSet = async (setId: string) => {
    console.log(`Deleting set ${setId}`);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('sets_logged')
        .delete()
        .eq('id', setId);

      if (error) {
        console.error('Error deleting set:', error);
        throw error;
      }

      console.log('Set deleted successfully');
      // Refresh the sets
      await fetchLoggedSets();
    } catch (error) {
      console.error('Failed to delete set:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workout) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-muted-foreground mb-4">Workout not found</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold">{workout.label}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(workout.scheduled_for), 'EEEE, MMM d')}
          </p>
        </div>
        <Button
          onClick={handleFinishWorkout}
          disabled={isSaving || loggedSets.length === 0}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Rest Timer */}
      <RestTimer />

      {/* Exercise Tabs */}
      {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
        <Tabs
          value={selectedExercise?.id || ''}
          onValueChange={(value) => {
            const exercise = workout.workout_exercises?.find(
              (ex) => ex.id === value,
            );
            setSelectedExercise(exercise || null);
          }}
        >
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            {workout.workout_exercises
              .sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0))
              .map((exercise) => (
                <TabsTrigger
                  key={exercise.id}
                  value={exercise.id}
                  className="whitespace-nowrap"
                >
                  {exercise.exercise.name}
                </TabsTrigger>
              ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingExercise(true)}
              className="ml-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TabsList>

          {selectedExercise && (
            <TabsContent value={selectedExercise.id} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedExercise.exercise.name}</CardTitle>
                  <CardDescription>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">
                        {selectedExercise.exercise.primary_muscle}
                      </Badge>
                      <Badge variant="outline">
                        {selectedExercise.exercise.type}
                      </Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SetsList
                    sets={loggedSets
                      .filter(
                        (s) => s.exercise_id === selectedExercise.exercise_id,
                      )
                      .map((s) => ({
                        id: s.id ?? '',
                        exerciseId: s.exercise_id,
                        exerciseName: selectedExercise.exercise.name,
                        setNumber: s.set_number,
                        weight: s.weight,
                        reps: s.reps,
                        rir: s.rir,
                        rpe: s.rpe,
                        isMyoRep: s.is_myo_rep,
                        isPartial: s.is_partial,
                        myoRepCount:
                          (s as LoggedSet & { myo_rep_count?: number })
                            .myo_rep_count ?? 0,
                        partialCount:
                          (s as LoggedSet & { partial_count?: number })
                            .partial_count ?? 0,
                      }))}
                    onSetUpdated={fetchLoggedSets}
                    onSetDeleted={fetchLoggedSets}
                    onUpdateSet={handleUpdateSet}
                    onDeleteSet={handleDeleteSet}
                  />
                  <SetLogger
                    previousSets={[]}
                    defaults={selectedExercise.defaults}
                    onLogSet={async (setData) =>
                      await handleLogSet(selectedExercise.exercise_id, setData)
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center">
            <p className="text-muted-foreground mb-4">
              No exercises added to this workout yet
            </p>
            <Button onClick={() => setIsAddingExercise(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exercise Selector Modal */}
      {isAddingExercise && (
        <ExerciseSelector
          onSelect={handleAddExercise}
          onClose={() => setIsAddingExercise(false)}
        />
      )}
    </div>
  );
}
