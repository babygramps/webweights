'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, addWeeks } from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// Form schemas for each step
const mesocycleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  weeks: z
    .number()
    .min(1, 'Must be at least 1 week')
    .max(52, 'Maximum 52 weeks'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
});

type MesocycleFormData = z.infer<typeof mesocycleSchema>;

interface WorkoutTemplate {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  label: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: string;
    rir?: number;
    rpe?: number;
    rest: string;
  }[];
}

export function MesocycleWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(
    [],
  );

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const form = useForm<MesocycleFormData>({
    resolver: zodResolver(mesocycleSchema),
    defaultValues: {
      title: '',
      weeks: 4,
      startDate: new Date(),
    },
  });

  const onSubmit = async (data: MesocycleFormData) => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final submission
    setIsSubmitting(true);
    try {
      console.log('Creating mesocycle with data:', data);
      console.log('Workout templates:', workoutTemplates);

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create mesocycle
      const { data: mesocycle, error: mesocycleError } = await supabase
        .from('mesocycles')
        .insert({
          user_id: user.id,
          title: data.title,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
          weeks: data.weeks,
        })
        .select()
        .single();

      if (mesocycleError) {
        console.error('Error creating mesocycle:', mesocycleError);
        throw mesocycleError;
      }

      console.log('Created mesocycle:', mesocycle);

      // Create workouts for each week
      if (workoutTemplates.length > 0) {
        const workouts = [];
        for (let week = 0; week < data.weeks; week++) {
          for (const template of workoutTemplates) {
            const workoutDate = addWeeks(data.startDate, week);
            workoutDate.setDate(
              workoutDate.getDate() + template.dayOfWeek - workoutDate.getDay(),
            );

            workouts.push({
              mesocycle_id: mesocycle.id,
              scheduled_for: format(workoutDate, 'yyyy-MM-dd'),
              label: template.label,
            });
          }
        }

        const { error: workoutsError } = await supabase
          .from('workouts')
          .insert(workouts);

        if (workoutsError) {
          console.error('Error creating workouts:', workoutsError);
          throw workoutsError;
        }

        console.log('Created workouts successfully');
      }

      toast.success('Mesocycle created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create mesocycle:', error);
      toast.error('Failed to create mesocycle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Create Your Mesocycle</CardTitle>
                <CardDescription>
                  Let&#39;s start by setting up the basic details of your
                  training program.
                </CardDescription>
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
                          placeholder="e.g., Hypertrophy Block, Strength Phase"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Give your training program a descriptive name.
                      </FormDescription>
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
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        How many weeks will this mesocycle last?
                      </FormDescription>
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
                              variant={'outline'}
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When do you want to start this mesocycle?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Your Workouts</CardTitle>
                <CardDescription>
                  Choose which days you&#39;ll train each week. You can add
                  exercises in the next step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutScheduler
                  workoutTemplates={workoutTemplates}
                  onUpdate={setWorkoutTemplates}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button type="button" onClick={goToNextStep}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
                <CardDescription>
                  Review your mesocycle details before creating.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Mesocycle Summary</h3>
                  <p>
                    <span className="text-muted-foreground">Title:</span>{' '}
                    {form.getValues('title')}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Duration:</span>{' '}
                    {form.getValues('weeks')} weeks
                  </p>
                  <p>
                    <span className="text-muted-foreground">Start Date:</span>{' '}
                    {format(form.getValues('startDate'), 'PPP')}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Workouts per Week:
                    </span>{' '}
                    {workoutTemplates.length}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>Creating...</>
                  ) : (
                    <>
                      Create Mesocycle
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}

// Workout Scheduler Component
function WorkoutScheduler({
  workoutTemplates,
  onUpdate,
}: {
  workoutTemplates: WorkoutTemplate[];
  onUpdate: (templates: WorkoutTemplate[]) => void;
}) {
  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
  ];

  const toggleDay = (dayOfWeek: number, label: string) => {
    const existingIndex = workoutTemplates.findIndex(
      (w) => w.dayOfWeek === dayOfWeek,
    );

    if (existingIndex >= 0) {
      // Remove the workout
      const updated = workoutTemplates.filter(
        (_, index) => index !== existingIndex,
      );
      onUpdate(updated);
    } else {
      // Add a new workout
      const newWorkout: WorkoutTemplate = {
        id: `workout-${Date.now()}`,
        dayOfWeek,
        label,
        exercises: [],
      };
      onUpdate([...workoutTemplates, newWorkout]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {daysOfWeek.map((day) => {
          const isSelected = workoutTemplates.some(
            (w) => w.dayOfWeek === day.value,
          );
          return (
            <Button
              key={day.value}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className="h-20"
              onClick={() => toggleDay(day.value, `${day.label} Workout`)}
            >
              <div className="text-center">
                <div className="font-semibold">{day.label}</div>
                {isSelected && (
                  <div className="text-xs mt-1">
                    {
                      workoutTemplates.find((w) => w.dayOfWeek === day.value)
                        ?.label
                    }
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {workoutTemplates.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Selected Workouts:</h4>
          <ul className="space-y-1 text-sm">
            {workoutTemplates
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((workout) => (
                <li key={workout.id}>
                  {daysOfWeek.find((d) => d.value === workout.dayOfWeek)?.label}
                  : {workout.label}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
