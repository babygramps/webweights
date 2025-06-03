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

  const firstWeekStart = startOfWeek(startDate, { weekStartsOn: 0 });

  for (let week = 0; week < weeks; week++) {
    const weekStart = addWeeks(firstWeekStart, week);
    const weekNumber = week + 1;

    const weekProgression = progression?.weeklyProgressions?.find(
      (p) => p.week === weekNumber,
    );

    templates.forEach((template) => {
      template.dayOfWeek.forEach((dayOfWeek) => {
        const workoutDate = addDays(weekStart, dayOfWeek);
        if (workoutDate >= startDate) {
          const workoutId = crypto.randomUUID();
          workouts.push({
            id: workoutId,
            mesocycle_id: mesocycleId,
            scheduled_for: format(workoutDate, 'yyyy-MM-dd'),
            label: `${template.label} - Week ${weekNumber}`,
            week_number: weekNumber,
            intensity_modifier: weekProgression?.intensity,
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
        }
      });
    });
  }

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
      startDate: format(basics.startDate, 'yyyy-MM-dd'),
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
