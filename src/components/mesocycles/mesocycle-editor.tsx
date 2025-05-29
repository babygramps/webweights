'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addWeeks, addDays, startOfWeek } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { parseLocalDate } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  WorkoutTemplateDesigner,
  WorkoutTemplate,
} from './workout-template-designer';

const mesocycleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  weeks: z
    .number()
    .min(1, 'Must be at least 1 week')
    .max(52, 'Maximum 52 weeks'),
  startDate: z.date({ required_error: 'Start date is required' }),
});

type MesocycleFormData = z.infer<typeof mesocycleSchema>;

export function MesocycleEditor({ mesocycleId }: { mesocycleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(
    [],
  );
  const [existingWorkouts, setExistingWorkouts] = useState<
    Array<{
      id: string;
      mesocycle_id: string;
      scheduled_for: string;
      label: string;
      workout_exercises?: Array<{
        id: string;
        workout_id: string;
        exercise_id: string;
        order_idx: number;
        defaults: unknown;
        exercise: {
          id: string;
          name: string;
        };
      }>;
    }>
  >([]);

  const form = useForm<MesocycleFormData>({
    resolver: zodResolver(mesocycleSchema),
    defaultValues: {
      title: '',
      weeks: 4,
      startDate: new Date(),
    },
  });

  useEffect(() => {
    const fetchMesocycle = async () => {
      const supabase = createClient();

      // Fetch mesocycle details
      const { data, error } = await supabase
        .from('mesocycles')
        .select('*')
        .eq('id', mesocycleId)
        .single();

      if (error) {
        console.error('Failed to fetch mesocycle:', error);
        toast.error('Could not load mesocycle');
        router.push('/dashboard');
        return;
      }

      // Fetch existing workouts for this mesocycle
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select(
          `
          *,
          workout_exercises (
            *,
            exercise:exercises (
              id,
              name
            )
          )
        `,
        )
        .eq('mesocycle_id', mesocycleId)
        .order('scheduled_for');

      if (!workoutsError && workouts) {
        setExistingWorkouts(workouts);
        console.log(
          '[MesocycleEditor] Loaded existing workouts:',
          workouts.length,
        );
      }

      form.reset({
        title: data.title,
        weeks: data.weeks,
        startDate: parseLocalDate(data.start_date),
      });
      setLoading(false);
    };

    fetchMesocycle();
  }, [mesocycleId, form, router]);

  const generateWorkoutsFromTemplates = (
    templates: WorkoutTemplate[],
    startDate: Date,
    weeks: number,
    mesocycleId: string,
  ) => {
    const workouts: Array<{
      id: string;
      mesocycle_id: string;
      scheduled_for: string;
      label: string;
    }> = [];
    const exercises: Array<{
      id: string;
      workout_id: string;
      exercise_id: string;
      order_idx: number;
      defaults: {
        sets: number;
        reps: string;
        rir?: number;
        rpe?: number;
        rest: string;
      };
    }> = [];

    console.log('[MesocycleEditor] Generating workouts from templates:', {
      templatesCount: templates.length,
      startDate: format(startDate, 'yyyy-MM-dd'),
      weeks,
    });

    // Get the start of the week containing the start date
    const firstWeekStart = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday

    // For each week in the mesocycle
    for (let week = 0; week < weeks; week++) {
      const weekStart = addWeeks(firstWeekStart, week);

      // For each workout template
      templates.forEach((template) => {
        // For each scheduled day of the week
        template.dayOfWeek.forEach((dayOfWeek) => {
          const workoutDate = addDays(weekStart, dayOfWeek);

          // Only create workout if it's on or after the start date
          if (workoutDate >= startDate) {
            const workoutId = crypto.randomUUID();

            // Create workout
            workouts.push({
              id: workoutId,
              mesocycle_id: mesocycleId,
              scheduled_for: format(workoutDate, 'yyyy-MM-dd'),
              label: `${template.label} - Week ${week + 1}`,
            });

            // Create workout exercises
            template.exercises.forEach((exercise) => {
              exercises.push({
                id: crypto.randomUUID(),
                workout_id: workoutId,
                exercise_id: exercise.exerciseId,
                order_idx: exercise.orderIdx,
                defaults: exercise.defaults,
              });
            });

            console.log('[MesocycleEditor] Generated workout:', {
              date: format(workoutDate, 'yyyy-MM-dd EEEE'),
              label: `${template.label} - Week ${week + 1}`,
              exerciseCount: template.exercises.length,
            });
          }
        });
      });
    }

    return { workouts, exercises };
  };

  const onSubmit = async (data: MesocycleFormData) => {
    setSaving(true);
    console.log('[MesocycleEditor] Saving mesocycle updates:', data);
    console.log('[MesocycleEditor] Workout templates:', workoutTemplates);

    const supabase = createClient();
    const { error } = await supabase
      .from('mesocycles')
      .update({
        title: data.title,
        weeks: data.weeks,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
      })
      .eq('id', mesocycleId);

    if (error) {
      console.error('Failed to update mesocycle:', error);
      toast.error('Failed to save mesocycle');
      setSaving(false);
      return;
    }

    // Handle workout templates if any were created
    if (workoutTemplates.length > 0) {
      try {
        // Delete existing workouts first (optional - you might want to keep them)
        if (existingWorkouts.length > 0) {
          const { error: deleteError } = await supabase
            .from('workouts')
            .delete()
            .eq('mesocycle_id', mesocycleId);

          if (deleteError) {
            console.error(
              '[MesocycleEditor] Error deleting existing workouts:',
              deleteError,
            );
          }
        }

        // Generate and create new workouts
        const { workouts, exercises } = generateWorkoutsFromTemplates(
          workoutTemplates,
          data.startDate,
          data.weeks,
          mesocycleId,
        );

        // Insert workouts
        if (workouts.length > 0) {
          const { error: workoutsError } = await supabase
            .from('workouts')
            .insert(workouts);

          if (workoutsError) {
            console.error(
              '[MesocycleEditor] Error creating workouts:',
              workoutsError,
            );
            throw workoutsError;
          }

          console.log('[MesocycleEditor] Created', workouts.length, 'workouts');
        }

        // Insert workout exercises
        if (exercises.length > 0) {
          const { error: exercisesError } = await supabase
            .from('workout_exercises')
            .insert(exercises);

          if (exercisesError) {
            console.error(
              '[MesocycleEditor] Error creating workout exercises:',
              exercisesError,
            );
            throw exercisesError;
          }

          console.log(
            '[MesocycleEditor] Created',
            exercises.length,
            'workout exercises',
          );
        }
      } catch (err) {
        console.error('[MesocycleEditor] Error updating workouts:', err);
        toast.error('Failed to update workouts');
        setSaving(false);
        return;
      }
    }

    toast.success('Mesocycle updated');
    router.push('/dashboard');
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="workouts">Workouts</TabsTrigger>
      </TabsList>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Edit Mesocycle</CardTitle>
                <CardDescription>Update your mesocycle details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesocycle Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Hypertrophy Block"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (weeks)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="52"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workouts">
            <Card>
              <CardContent className="pt-6">
                {existingWorkouts.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> This mesocycle has{' '}
                      {existingWorkouts.length} existing workouts. Creating new
                      workout templates will replace all existing workouts.
                    </p>
                  </div>
                )}
                <WorkoutTemplateDesigner
                  templates={workoutTemplates}
                  onTemplatesChange={setWorkoutTemplates}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <CardFooter className="flex justify-between mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Tabs>
  );
}
