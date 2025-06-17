import { describe, it, expect } from 'vitest';
import { aggregateSetsByWorkout } from '@/lib/utils/stats-utils';

describe('aggregateSetsByWorkout', () => {
  it('groups sets by workout and sums volume', () => {
    const data = [
      {
        workoutId: 'w1',
        workoutDate: '2024-05-01',
        date: '2024-05-01T10:00',
        weight: 100,
        reps: 5,
        volume: 500,
      },
      {
        workoutId: 'w1',
        workoutDate: '2024-05-01',
        date: '2024-05-01T10:05',
        weight: 90,
        reps: 5,
        volume: 450,
      },
      {
        workoutId: 'w2',
        workoutDate: '2024-05-02',
        date: '2024-05-02T10:00',
        weight: 80,
        reps: 8,
        volume: 640,
      },
    ];
    const result = aggregateSetsByWorkout(data);
    expect(result).toHaveLength(2);
    const first = result[0];
    expect(first.volume).toBe(950);
    expect(first.sets).toBe(2);
  });
});
