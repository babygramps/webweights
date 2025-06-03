'use client';

import { useState } from 'react';
import { format, addDays, addWeeks } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Calendar, Dumbbell } from 'lucide-react';
import {
  WorkoutTemplate,
  WorkoutExerciseTemplate,
} from './workout-template-designer';
import { MesocycleProgression, WeekIntensity } from '@/types/progression';
import { cn } from '@/lib/utils';
import {
  applyProgressionStrategyToExercise,
  determineExerciseType,
  EnhancedExerciseDefaults,
} from '@/lib/utils/progression-strategy-utils';

interface WorkoutWeekPreviewProps {
  startDate: Date;
  weeks: number;
  workoutTemplates: WorkoutTemplate[];
  progression?: MesocycleProgression | null;
}

export function WorkoutWeekPreview({
  startDate,
  weeks,
  workoutTemplates,
  progression,
}: WorkoutWeekPreviewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  console.log('[WorkoutWeekPreview] Rendering preview with:', {
    weeks,
    templates: workoutTemplates.length,
    hasProgression: !!progression,
    progressionStrategy: progression?.progressionStrategy,
  });

  const toggleWeek = (weekNumber: number) => {
    console.log(`[WorkoutWeekPreview] Toggling week ${weekNumber}`);
    setExpandedWeeks((prev) =>
      prev.includes(weekNumber)
        ? prev.filter((w) => w !== weekNumber)
        : [...prev, weekNumber],
    );
  };

  const toggleAllWeeks = () => {
    console.log(
      '[WorkoutWeekPreview] Toggling all weeks:',
      showAllWeeks ? 'collapsing' : 'expanding',
    );
    if (showAllWeeks) {
      setExpandedWeeks([]);
      setShowAllWeeks(false);
    } else {
      setExpandedWeeks(Array.from({ length: weeks }, (_, i) => i + 1));
      setShowAllWeeks(true);
    }
  };

  const getWeekIntensity = (weekNumber: number): WeekIntensity | null => {
    if (!progression) return null;
    const weekIntensity =
      progression.weeklyProgressions.find((w) => w.week === weekNumber) || null;
    if (weekIntensity) {
      console.log(
        `[WorkoutWeekPreview] Week ${weekNumber} intensity:`,
        weekIntensity,
      );
    }
    return weekIntensity;
  };

  const applyIntensityToExercise = (
    exercise: WorkoutExerciseTemplate,
    weekIntensity: WeekIntensity | null,
  ): EnhancedExerciseDefaults => {
    // Use the new progression strategy utility
    const exerciseType = determineExerciseType(exercise.exerciseName);
    return applyProgressionStrategyToExercise(
      exercise,
      weekIntensity,
      progression?.progressionStrategy,
      exerciseType,
    );
  };

  const getWorkoutsForWeek = (weekNumber: number) => {
    const weekStart = addWeeks(startDate, weekNumber - 1);
    const workouts = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = addDays(weekStart, dayOffset);
      const dayOfWeek = currentDate.getDay();

      // Find all templates scheduled for this day
      const templatesForDay = workoutTemplates.filter((template) =>
        template.dayOfWeek.includes(dayOfWeek),
      );

      if (templatesForDay.length > 0) {
        workouts.push({
          date: currentDate,
          dayOfWeek,
          templates: templatesForDay,
        });
      }
    }

    console.log(
      `[WorkoutWeekPreview] Week ${weekNumber} workouts:`,
      workouts.length,
    );
    return workouts;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Weekly Workout Preview</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllWeeks}
          className="flex items-center gap-2"
        >
          {showAllWeeks ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
      </div>

      <Accordion
        type="multiple"
        value={expandedWeeks.map((w) => `week-${w}`)}
        className="space-y-2"
      >
        {Array.from({ length: weeks }, (_, i) => i + 1).map((weekNumber) => {
          const weekIntensity = getWeekIntensity(weekNumber);
          const weekWorkouts = getWorkoutsForWeek(weekNumber);
          const weekStart = addWeeks(startDate, weekNumber - 1);
          const weekEnd = addDays(weekStart, 6);

          return (
            <AccordionItem
              key={`week-${weekNumber}`}
              value={`week-${weekNumber}`}
              className="border rounded-lg"
            >
              <AccordionTrigger
                onClick={() => toggleWeek(weekNumber)}
                className="px-4 hover:no-underline"
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Week {weekNumber}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {weekIntensity?.isDeload && (
                      <Badge variant="secondary" className="text-xs">
                        Deload
                      </Badge>
                    )}
                    {weekIntensity?.label && (
                      <Badge variant="outline" className="text-xs">
                        {weekIntensity.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {weekWorkouts.length} workouts
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {weekWorkouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No workouts scheduled for this week
                    </p>
                  ) : (
                    weekWorkouts.map((workout, idx) => (
                      <Card key={idx} className="border-muted">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(workout.date, 'EEEE, MMMM d')}
                            </CardTitle>
                            {workout.templates.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {workout.templates.length} workouts
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {workout.templates.map((template) => (
                            <div key={template.id} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                <h5 className="font-medium">
                                  {template.label}
                                </h5>
                              </div>
                              <div className="ml-6 space-y-2">
                                {template.exercises.map((exercise, exIdx) => {
                                  const modifiedDefaults =
                                    applyIntensityToExercise(
                                      exercise,
                                      weekIntensity,
                                    );
                                  return (
                                    <div
                                      key={exercise.exerciseId}
                                      className={cn(
                                        'flex items-start justify-between p-2 rounded-md',
                                        'bg-muted/30 text-sm',
                                      )}
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {exIdx + 1}. {exercise.exerciseName}
                                        </div>
                                        <div className="text-muted-foreground text-xs mt-1">
                                          {modifiedDefaults.sets} sets ×{' '}
                                          {modifiedDefaults.reps} reps
                                          {modifiedDefaults.rir !== undefined &&
                                            ` @ RIR ${modifiedDefaults.rir}`}
                                          {modifiedDefaults.rpe !== undefined &&
                                            ` @ RPE ${modifiedDefaults.rpe}`}
                                          {modifiedDefaults.rest &&
                                            ` | Rest: ${modifiedDefaults.rest}`}
                                          {modifiedDefaults.weight &&
                                            modifiedDefaults.weight !== 100 &&
                                            ` | ${modifiedDefaults.weight}% weight`}
                                        </div>
                                      </div>
                                      {modifiedDefaults.intensityDescription && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs ml-2"
                                        >
                                          {
                                            modifiedDefaults.intensityDescription
                                          }
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {weeks > 0 && workoutTemplates.length > 0 && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Total:</strong> {weeks} weeks,{' '}
            {workoutTemplates.reduce(
              (sum, template) => sum + template.dayOfWeek.length * weeks,
              0,
            )}{' '}
            workouts scheduled
          </p>
        </div>
      )}
    </div>
  );
}
