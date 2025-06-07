import { describe, it, expect, vi, type Mock } from 'vitest';
import { WorkoutTemplateModifier } from '../services/workout-template-modifier';

// eslint-disable-next-line no-var
var insertMock: Mock;
// eslint-disable-next-line no-var
var updateMock: Mock;
// eslint-disable-next-line no-var
var valuesMock: Mock;

vi.mock('@/db', () => {
  valuesMock = vi.fn();
  insertMock = vi.fn(() => ({ values: valuesMock }));
  updateMock = vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn() }));
  return {
    db: { insert: insertMock, update: updateMock },
    workoutExercises: {},
    workouts: {},
  };
});

describe('WorkoutTemplateModifier', () => {
  it('inserts new exercises and bumps template version', async () => {
    const modifier = new WorkoutTemplateModifier();
    const template = { exerciseId: 'e1', orderIdx: 1, defaults: { sets: 3 } };
    await modifier.addExerciseToWorkouts(['w1', 'w2'], template);

    expect(insertMock).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
  });
});
