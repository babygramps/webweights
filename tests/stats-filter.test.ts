import { describe, it, expect } from 'vitest';
import { isDateInRange, filterPersonalRecords } from '@/lib/utils/stats-filter';

const userExercises = [
  { id: 'e1', name: 'Bench', type: null, primaryMuscle: 'Chest' },
  { id: 'e2', name: 'Squat', type: null, primaryMuscle: 'Legs' },
];

const prs = [
  {
    exerciseId: 'e1',
    exerciseName: 'Bench',
    maxWeight: { weight: 100, reps: 1, date: '2024-05-01' },
    maxVolume: null,
    maxReps: null,
  },
  {
    exerciseId: 'e2',
    exerciseName: 'Squat',
    maxWeight: { weight: 150, reps: 5, date: '2024-04-01' },
    maxVolume: null,
    maxReps: null,
  },
];

describe('isDateInRange', () => {
  it('checks date boundaries', () => {
    const range = { from: new Date('2024-05-01'), to: new Date('2024-05-31') };
    expect(isDateInRange('2024-05-10', range)).toBe(true);
    expect(isDateInRange('2024-04-30', range)).toBe(false);
  });
});

describe('filterPersonalRecords', () => {
  it('filters by exercise and date', () => {
    const range = { from: new Date('2024-05-01'), to: new Date('2024-05-31') };
    const result = filterPersonalRecords(prs, {
      range,
      exerciseId: 'e1',
      userExercises,
    });
    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('e1');
  });
});
