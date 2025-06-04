import logger from '@/lib/logger';
import { addDays, addWeeks, startOfWeek, format } from 'date-fns';
import { WorkoutTemplate } from '@/components/mesocycles/workout-template-designer';
import { MesocycleProgression } from '@/types/progression';

export interface GeneratedWorkout {
  id: string;
  mesocycle_id: string;
  scheduled_for: string;
  label: string;
  week_number: number;
  intensity_modifier?: object;
}

export interface GeneratedExercise {
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
}

export interface MesocycleBasics {
  title: string;
  weeks: number;
  startDate: Date;
}

export interface MesocycleExport {
  basics: {
    title: string;
    weeks: number;
    startDate: string;
  };
  workoutTemplates: WorkoutTemplate[];
  progression?: MesocycleProgression;
  workouts: GeneratedWorkout[];
  exercises: GeneratedExercise[];
}

export function generateWorkoutsFromTemplates(
  templates: WorkoutTemplate[],
  startDate: Date,
  weeks: number,
  mesocycleId: string,
  progression?: MesocycleProgression | null,
): { workouts: GeneratedWorkout[]; exercises: GeneratedExercise[] } {
  const workouts: GeneratedWorkout[] = [];
  const exercises: GeneratedExercise[] = [];

  logger.log('[generateWorkoutsFromTemplates] Starting generation with:', {
    startDate: format(startDate, 'yyyy-MM-dd (EEEE)'),
    weeks,
    templatesCount: templates.length,
    templates: templates.map((t) => ({
      label: t.label,
      dayOfWeek: t.dayOfWeek,
      exerciseCount: t.exercises.length,
    })),
  });

  const mesocycleStart = new Date(startDate);
  logger.log(
    '[generateWorkoutsFromTemplates] Mesocycle start:',
    format(mesocycleStart, 'yyyy-MM-dd (EEEE)'),
  );

  for (let week = 0; week < weeks; week++) {
    const weekNumber = week + 1;
    const weekStart = addWeeks(mesocycleStart, week);

    logger.log(
      `[generateWorkoutsFromTemplates] Processing Week ${weekNumber}:`,
      {
        weekStart: format(weekStart, 'yyyy-MM-dd (EEEE)'),
        weekNumber,
      },
    );

    const weekProgression = progression?.weeklyProgressions?.find(
      (p) => p.week === weekNumber,
    );

    templates.forEach((template) => {
      template.dayOfWeek.forEach((dayOfWeek) => {
        let workoutDate: Date;

        if (week === 0 && dayOfWeek === mesocycleStart.getDay()) {
          workoutDate = new Date(mesocycleStart);
        } else {
          const weekStartSunday = startOfWeek(weekStart, { weekStartsOn: 0 });
          workoutDate = addDays(weekStartSunday, dayOfWeek);

          if (workoutDate < mesocycleStart) {
            workoutDate = addWeeks(workoutDate, 1);
          }
        }

        const isAfterStart = workoutDate >= mesocycleStart;

        logger.log(`[generateWorkoutsFromTemplates] Checking workout date:`, {
          template: template.label,
          dayOfWeek,
          workoutDate: format(workoutDate, 'yyyy-MM-dd (EEEE)'),
          startDate: format(mesocycleStart, 'yyyy-MM-dd (EEEE)'),
          isAfterStart,
          weekNumber,
          isWeek1: week === 0,
        });

        if (isAfterStart) {
          const workoutId = crypto.randomUUID();
          workouts.push({
            id: workoutId,
            mesocycle_id: mesocycleId,
            scheduled_for: format(workoutDate, 'yyyy-MM-dd'),
            label: `${template.label} - Week ${weekNumber}`,
            week_number: weekNumber,
            intensity_modifier: weekProgression?.intensity,
          });

          logger.log(`[generateWorkoutsFromTemplates] ✅ Created workout:`, {
            date: format(workoutDate, 'yyyy-MM-dd (EEEE)'),
            label: `${template.label} - Week ${weekNumber}`,
            weekNumber,
          });

          template.exercises.forEach((exercise) => {
            exercises.push({
              id: crypto.randomUUID(),
              workout_id: workoutId,
              exercise_id: exercise.exerciseId,
              order_idx: exercise.orderIdx,
              defaults: exercise.defaults,
            });
          });
        } else {
          logger.log(
            `[generateWorkoutsFromTemplates] ❌ Skipped workout (before start):`,
            {
              template: template.label,
              workoutDate: format(workoutDate, 'yyyy-MM-dd (EEEE)'),
              startDate: format(mesocycleStart, 'yyyy-MM-dd (EEEE)'),
              weekNumber,
            },
          );
        }
      });
    });
  }

  logger.log('[generateWorkoutsFromTemplates] Generation complete:', {
    totalWorkouts: workouts.length,
    totalExercises: exercises.length,
    workoutsByWeek: workouts.reduce(
      (acc, w) => {
        acc[w.week_number] = (acc[w.week_number] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    ),
  });

  return { workouts, exercises };
}

export function generateMesocycleExport(
  basics: MesocycleBasics,
  templates: WorkoutTemplate[],
  progression?: MesocycleProgression | null,
): MesocycleExport {
  const mesocycleId = crypto.randomUUID();
  const { workouts, exercises } = generateWorkoutsFromTemplates(
    templates,
    basics.startDate,
    basics.weeks,
    mesocycleId,
    progression,
  );

  return {
    basics: {
      title: basics.title,
      weeks: basics.weeks,
      startDate: basics.startDate.toISOString().split('T')[0],
    },
    workoutTemplates: templates,
    progression: progression || undefined,
    workouts,
    exercises,
  };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const rows = data.map((row) => headers.map((h) => escape(row[h])).join(','));
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
