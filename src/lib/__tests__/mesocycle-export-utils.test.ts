import { describe, it, expect } from 'vitest';
import { generateMesocycleExport } from '../utils/mesocycle-export-utils';
import { WorkoutTemplate } from '@/components/mesocycles/workout-template-designer';

const template: WorkoutTemplate = {
  id: 't1',
  label: 'Full Body',
  dayOfWeek: [1],
  exercises: [],
};

describe('generateMesocycleExport', () => {
  it('creates workouts for each week', () => {
    const data = generateMesocycleExport(
      {
        title: 'Test',
        weeks: 2,
        startDate: new Date('2024-01-01'),
      },
      [template],
      null,
    );

    expect(data.workouts).toHaveLength(2);
    expect(data.exercises).toHaveLength(0);
    expect(data.basics.title).toBe('Test');
    expect(data.basics.startDate).toBe('2024-01-01');
  });
});
