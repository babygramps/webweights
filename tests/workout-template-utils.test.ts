import { describe, it, expect } from 'vitest';
import { workoutsToTemplates } from '@/lib/utils/workout-template-utils';

const workouts = [
  {
    id: 'w1',
    scheduled_for: '2024-06-03',
    label: 'Push - Week 1',
    week_number: 1,
    workout_exercises: [
      {
        exercise_id: 'e1',
        order_idx: 0,
        defaults: { sets: 3, reps: '8-12', rest: '2:00' },
        exercise: { name: 'Bench' },
      },
    ],
  },
  {
    id: 'w2',
    scheduled_for: '2024-06-05',
    label: 'Pull - Week 1',
    week_number: 1,
    workout_exercises: [
      {
        exercise_id: 'e2',
        order_idx: 0,
        defaults: { sets: 4, reps: '10', rest: '2:00' },
        exercise: { name: 'Row' },
      },
    ],
  },
  {
    id: 'w3',
    scheduled_for: '2024-06-10',
    label: 'Push - Week 2',
    week_number: 2,
    workout_exercises: [
      {
        exercise_id: 'e1',
        order_idx: 0,
        defaults: { sets: 3, reps: '8-12', rest: '2:00' },
        exercise: { name: 'Bench' },
      },
    ],
  },
];

describe('workoutsToTemplates', () => {
  it('converts workouts to templates grouped by label', () => {
    const templates = workoutsToTemplates(workouts);
    expect(templates).toHaveLength(2);
    const push = templates.find((t) => t.label === 'Push');
    const pull = templates.find((t) => t.label === 'Pull');
    expect(push?.dayOfWeek).toEqual([1]);
    expect(pull?.dayOfWeek).toEqual([3]);
    expect(push?.exercises[0].exerciseId).toBe('e1');
  });
});
