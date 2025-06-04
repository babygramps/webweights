'use client';
import logger from '@/lib/logger';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addWeeks } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
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
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  WorkoutTemplateDesigner,
  WorkoutTemplate,
} from '@/components/mesocycles/workout-template-designer';
import { ProgressiveIntensityDesigner } from '@/components/mesocycles/progressive-intensity-designer';
import { WorkoutWeekPreview } from '@/components/mesocycles/workout-week-preview';
import { MesocycleProgression } from '@/types/progression';
import { Badge } from '@/components/ui/badge';
import {
  generateWorkoutsFromTemplates,
  generateMesocycleExport,
  downloadJson,
} from '@/lib/utils/mesocycle-export-utils';

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

export function MesocycleWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(
    [],
  );
  const [progression, setProgression] = useState<MesocycleProgression | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const form = useForm<MesocycleFormData>({
    resolver: zodResolver(mesocycleSchema),
    defaultValues: {
      title: '',
      weeks: 4,
      startDate: new Date(),
    },
  });

  logger.log('[MesocycleWizard] Current step:', currentStep);

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

  const onSubmit = async (data: MesocycleFormData) => {
    try {
      setSaving(true);
      logger.log('[MesocycleWizard] Submitting mesocycle:', data);
      logger.log('[MesocycleWizard] Workout templates:', workoutTemplates);
      logger.log('[MesocycleWizard] Progression:', progression);

      const supabase = createClient();
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
          weeks: data.weeks,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (mesocycleError) {
        logger.error(
          '[MesocycleWizard] Error creating mesocycle:',
          mesocycleError,
        );
        throw mesocycleError;
      }

      logger.log('[MesocycleWizard] Created mesocycle:', mesocycle);

      // Save progression if configured
      if (progression) {
        const progressionData = {
          mesocycle_id: mesocycle.id,
          progression_type: progression.progressionType,
          baseline_week: progression.baselineWeek,
          weekly_progressions: progression.weeklyProgressions,
          global_settings: progression.globalSettings,
          progression_strategy: progression.progressionStrategy,
        };

        const { error: progressionError } = await supabase
          .from('mesocycle_progressions')
          .insert(progressionData);

        if (progressionError) {
          logger.error(
            '[MesocycleWizard] Error saving progression:',
            progressionError,
          );
          // Don't throw here - progression is optional
        } else {
          logger.log('[MesocycleWizard] Saved progression data');
        }
      }

      // Generate and create workouts
      if (workoutTemplates.length > 0) {
        const { workouts, exercises } = generateWorkoutsFromTemplates(
          workoutTemplates,
          data.startDate,
          data.weeks,
          mesocycle.id,
          progression,
        );

        // Insert workouts
        if (workouts.length > 0) {
          const { error: workoutsError } = await supabase
            .from('workouts')
            .insert(workouts);

          if (workoutsError) {
            logger.error(
              '[MesocycleWizard] Error creating workouts:',
              workoutsError,
            );
            throw workoutsError;
          }

          logger.log('[MesocycleWizard] Created', workouts.length, 'workouts');
        }

        // Insert workout exercises
        if (exercises.length > 0) {
          const { error: exercisesError } = await supabase
            .from('workout_exercises')
            .insert(exercises);

          if (exercisesError) {
            logger.error(
              '[MesocycleWizard] Error creating workout exercises:',
              exercisesError,
            );
            throw exercisesError;
          }

          logger.log(
            '[MesocycleWizard] Created',
            exercises.length,
            'workout exercises',
          );
        }
      }

      toast.success('Mesocycle created successfully!');
      router.push('/dashboard');
    } catch (error) {
      logger.error('[MesocycleWizard] Error:', error);
      toast.error('Failed to create mesocycle');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const values = form.getValues();
    const exportData = generateMesocycleExport(
      {
        title: values.title,
        weeks: values.weeks,
        startDate: values.startDate,
      },
      workoutTemplates,
      progression,
    );
    const filename = `${values.title || 'mesocycle'}.json`;
    downloadJson(exportData, filename);
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
          <WorkoutTemplateDesigner
            templates={workoutTemplates}
            onTemplatesChange={setWorkoutTemplates}
          />
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
                  <div className="space-y-4">
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

                    {progression.progressionStrategy && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">
                          Progression Strategy
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Primary Focus
                            </p>
                            <p className="font-medium capitalize">
                              {progression.progressionStrategy.primary}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Adjustments</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(
                                progression.progressionStrategy
                                  .secondaryAdjustments,
                              )
                                .filter(([, enabled]) => enabled)
                                .map(([key]) => (
                                  <Badge
                                    key={key}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {key}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                Export
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? 'Creating...' : 'Create Mesocycle'}
                <Check className="h-4 w-4" />
              </Button>
            </div>
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
