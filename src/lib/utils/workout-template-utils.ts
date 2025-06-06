import { parseLocalDate } from '@/lib/utils/date';
import { WorkoutTemplate } from '@/components/mesocycles/workout-template-designer';

interface WorkoutExercise {
  exercise_id: string;
  order_idx: number;
  defaults: {
    sets: number;
    reps: string;
    rir?: number;
    rpe?: number;
    rest: string;
  };
  exercise?: { name: string } | null;
}

interface Workout {
  id: string;
  scheduled_for: string;
  label: string;
  week_number?: number;
  workout_exercises?: WorkoutExercise[] | null;
}

/**
 * Convert a list of workouts with exercises into workout templates.
 * Workouts sharing the same base label are aggregated into one template
 * with all associated days of the week.
 */
export function workoutsToTemplates(workouts: Workout[]): WorkoutTemplate[] {
  const templateMap = new Map<string, WorkoutTemplate>();

  workouts.forEach((w) => {
    const baseLabel = w.label.replace(/ - Week \d+$/, '');
    const day = parseLocalDate(w.scheduled_for).getDay();

    if (!templateMap.has(baseLabel)) {
      templateMap.set(baseLabel, {
        id: crypto.randomUUID(),
        label: baseLabel,
        dayOfWeek: [day],
        exercises:
          (w.workout_exercises || [])
            .sort((a, b) => a.order_idx - b.order_idx)
            .map((ex) => ({
              exerciseId: ex.exercise_id,
              exerciseName: ex.exercise?.name,
              orderIdx: ex.order_idx,
              defaults: ex.defaults,
            })) || [],
      });
    } else {
      const existing = templateMap.get(baseLabel)!;
      if (!existing.dayOfWeek.includes(day)) {
        existing.dayOfWeek.push(day);
        existing.dayOfWeek.sort();
      }
    }
  });

  return Array.from(templateMap.values());
}
