'use client';
import logger from '@/lib/logger';

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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  WorkoutTemplateDesigner,
  WorkoutTemplate,
} from '@/components/mesocycles/workout-template-designer';
import { ProgressiveIntensityDesigner } from '@/components/mesocycles/progressive-intensity-designer';
import { WorkoutWeekPreview } from '@/components/mesocycles/workout-week-preview';
import { MesocycleProgression } from '@/types/progression';

const mesocycleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  weeks: z
    .number()
    .min(1, 'Must be at least 1 week')
    .max(52, 'Maximum 52 weeks'),
  startDate: z.date({ required_error: 'Start date is required' }),
});

type MesocycleFormData = z.infer<typeof mesocycleSchema>;

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const STEPS = [
  { id: 'basics', title: 'Basic Info', description: 'Name and duration' },
  {
    id: 'workouts',
    title: 'Workout Schedule',
    description: 'Design your workouts',
  },
  {
    id: 'intensity',
    title: 'Progressive Intensity',
    description: 'Plan intensity progression',
  },
  { id: 'review', title: 'Review', description: 'Confirm your mesocycle' },
];

export function MesocycleEditWizard({
  mesocycleId,
  initialStep = 0,
}: {
  mesocycleId: string;
  initialStep?: number;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(
    [],
  );
  const [progression, setProgression] = useState<MesocycleProgression | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [existingWorkouts, setExistingWorkouts] = useState<number>(0);
  const [workouts, setWorkouts] = useState<
    Array<{
      id: string;
      scheduled_for: string;
      label: string;
      week_number?: number;
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

  logger.log('[MesocycleWizard] Current step:', currentStep);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('mesocycles')
        .select('*')
        .eq('id', mesocycleId)
        .single();
      if (error || !data) {
        toast.error('Could not load mesocycle');
        router.push('/dashboard');
        return;
      }
      form.reset({
        title: data.title,
        weeks: data.weeks,
        startDate: parseLocalDate(data.start_date),
      });
      const { data: prog } = await supabase
        .from('mesocycle_progressions')
        .select('*')
        .eq('mesocycle_id', mesocycleId)
        .single();
      if (prog) {
        setProgression({
          id: prog.id,
          mesocycleId,
          baselineWeek: prog.baseline_week,
          weeklyProgressions: prog.weekly_progressions,
          progressionType: prog.progression_type,
          globalSettings: prog.global_settings,
        });
      }
      const { count } = await supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('mesocycle_id', mesocycleId);
      setExistingWorkouts(count || 0);

      const { data: workoutData } = await supabase
        .from('workouts')
        .select('id, scheduled_for, label, week_number')
        .eq('mesocycle_id', mesocycleId)
        .order('scheduled_for', { ascending: true });
      setWorkouts(workoutData || []);
    };
    loadData();
  }, [mesocycleId, router, form]);
  const nextStep = () => {
    if (currentStep === 0) {
      // Validate basic info before proceeding
      form.trigger(['title', 'weeks', 'startDate']).then((isValid) => {
        if (isValid) {
          logger.log('[MesocycleWizard] Moving to workout design step');
          setCurrentStep(currentStep + 1);
        }
      });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

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
      week_number: number;
      intensity_modifier?: object;
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

    logger.log('[MesocycleWizard] Generating workouts from templates:', {
      templatesCount: templates.length,
      startDate: format(startDate, 'yyyy-MM-dd'),
      weeks,
    });

    // Get the start of the week containing the start date
    const firstWeekStart = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday

    // For each week in the mesocycle
    for (let week = 0; week < weeks; week++) {
      const weekStart = addWeeks(firstWeekStart, week);
      const weekNumber = week + 1;

      // Get intensity modifier for this week
      const weekProgression = progression?.weeklyProgressions?.find(
        (p) => p.week === weekNumber,
      );

      // For each workout template
      templates.forEach((template) => {
        // For each scheduled day of the week
        template.dayOfWeek.forEach((dayOfWeek) => {
          const workoutDate = addDays(weekStart, dayOfWeek);

          // Only create workout if it's on or after the start date
          if (workoutDate >= startDate) {
            const workoutId = crypto.randomUUID();

            // Create workout with intensity modifier
            workouts.push({
              id: workoutId,
              mesocycle_id: mesocycleId,
              scheduled_for: format(workoutDate, 'yyyy-MM-dd'),
              label: `${template.label} - Week ${weekNumber}`,
              week_number: weekNumber,
              intensity_modifier: weekProgression?.intensity,
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

            logger.log('[MesocycleWizard] Generated workout:', {
              date: format(workoutDate, 'yyyy-MM-dd EEEE'),
              label: `${template.label} - Week ${weekNumber}`,
              exerciseCount: template.exercises.length,
              intensity: weekProgression?.intensity,
            });
          }
        });
      });
    }

    return { workouts, exercises };
  };
  const onSubmit = async (data: MesocycleFormData) => {
    setSaving(true);
    logger.log('[MesocycleEditWizard] Saving mesocycle:', data);
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
      logger.error('[MesocycleEditWizard] Failed to update mesocycle:', error);
      toast.error('Failed to save mesocycle');
      setSaving(false);
      return;
    }

    await supabase
      .from('mesocycle_progressions')
      .delete()
      .eq('mesocycle_id', mesocycleId);
    if (progression) {
      const { error: progressionError } = await supabase
        .from('mesocycle_progressions')
        .insert({
          mesocycle_id: mesocycleId,
          progression_type: progression.progressionType,
          baseline_week: progression.baselineWeek,
          weekly_progressions: progression.weeklyProgressions,
          global_settings: progression.globalSettings,
        });
      if (progressionError) {
        logger.error(
          '[MesocycleEditWizard] Error saving progression:',
          progressionError,
        );
      }
    }

    if (workoutTemplates.length > 0) {
      if (existingWorkouts > 0) {
        const { error: delError } = await supabase
          .from('workouts')
          .delete()
          .eq('mesocycle_id', mesocycleId);
        if (delError) {
          logger.error(
            '[MesocycleEditWizard] Error deleting workouts:',
            delError,
          );
        }
      }

      const { workouts, exercises } = generateWorkoutsFromTemplates(
        workoutTemplates,
        data.startDate,
        data.weeks,
        mesocycleId,
      );

      if (workouts.length > 0) {
        const { error: workoutsError } = await supabase
          .from('workouts')
          .insert(workouts);
        if (workoutsError) {
          logger.error(
            '[MesocycleEditWizard] Error creating workouts:',
            workoutsError,
          );
        }
      }

      if (exercises.length > 0) {
        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercises);
        if (exercisesError) {
          logger.error(
            '[MesocycleEditWizard] Error creating workout exercises:',
            exercisesError,
          );
        }
      }
    }

    toast.success('Mesocycle updated');
    router.push('/dashboard');
    setSaving(false);
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form {...form}>
            <form className="space-y-4">
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
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
            </form>
          </Form>
        );

      case 1:
        return (
          <>
            {workouts.length > 0 && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Existing Workouts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workouts.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div>
                        <p className="font-medium">{w.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseLocalDate(w.scheduled_for), 'PPP')}
                        </p>
                      </div>
                      {w.week_number && (
                        <Badge variant="secondary" className="text-xs">
                          Week {w.week_number}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {existingWorkouts > 0 && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> This mesocycle has {existingWorkouts}{' '}
                  existing workouts. Creating new workout templates will replace
                  them.
                </p>
              </div>
            )}
            <WorkoutTemplateDesigner
              templates={workoutTemplates}
              onTemplatesChange={setWorkoutTemplates}
            />
          </>
        );
      case 2: {
        const currentFormData = form.getValues();
        return (
          <ProgressiveIntensityDesigner
            mesocycleWeeks={currentFormData.weeks}
            initialProgression={progression || undefined}
            onProgressionChange={setProgression}
          />
        );
      }

      case 3: {
        const reviewFormData = form.getValues();
        const endDate = addWeeks(
          reviewFormData.startDate,
          reviewFormData.weeks,
        );
        const totalWorkouts = workoutTemplates.reduce(
          (sum, template) =>
            sum + template.dayOfWeek.length * reviewFormData.weeks,
          0,
        );

        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mesocycle Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{reviewFormData.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{reviewFormData.weeks} weeks</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Workouts
                    </p>
                    <p className="font-medium">{totalWorkouts}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {format(reviewFormData.startDate, 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{format(endDate, 'PPP')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {workoutTemplates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Workout Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workoutTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div>
                        <p className="font-medium">{template.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.exercises.length} exercises
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {DAYS_OF_WEEK.filter((day) =>
                          template.dayOfWeek.includes(day.value),
                        ).map((day) => (
                          <Badge key={day.value} variant="secondary">
                            {day.label.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {progression && (
              <Card>
                <CardHeader>
                  <CardTitle>Intensity Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">
                          {progression.progressionType}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deload Weeks</p>
                        <p className="font-medium">
                          {
                            progression.weeklyProgressions.filter(
                              (w) => w.isDeload,
                            ).length
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Auto Deload</p>
                        <p className="font-medium">
                          {progression.globalSettings.autoDeload
                            ? 'Enabled'
                            : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {workoutTemplates.length > 0 && (
              <WorkoutWeekPreview
                startDate={reviewFormData.startDate}
                weeks={reviewFormData.weeks}
                workoutTemplates={workoutTemplates}
                progression={progression}
              />
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <Progress
          value={((currentStep + 1) / STEPS.length) * 100}
          className="mb-4"
        />
        <div className="grid grid-cols-4 gap-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'text-center',
                index === currentStep && 'text-primary',
                index < currentStep && 'text-primary',
                index > currentStep && 'text-muted-foreground',
              )}
            >
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs">{step.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Changes'}
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={nextStep} className="flex items-center gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
