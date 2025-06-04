import { describe, it, expect, vi, type Mock } from 'vitest';
import { getUserWorkoutData } from '@/db/queries/export';

// eslint-disable-next-line no-var
var selectMock: Mock;

vi.mock('@/db/index', () => {
  selectMock = vi.fn();
  return {
    db: { select: selectMock },
    workouts: {},
    setsLogged: {},
    exercises: {},
    mesocycles: {},
  };
});

type QueryResult = Record<string, unknown>[];
function createSelect(result: QueryResult) {
  return () => ({
    from: () => ({
      innerJoin: () => ({
        leftJoin: () => ({
          leftJoin: () => ({
            where: () => ({
              orderBy: () => Promise.resolve(result),
            }),
          }),
        }),
      }),
    }),
  });
}

describe('getUserWorkoutData', () => {
  it('returns flattened workout rows', async () => {
    selectMock.mockImplementationOnce(
      createSelect([
        { workoutDate: '2024-01-01', exerciseName: 'Bench', reps: 5 },
      ]),
    );

    const result = await getUserWorkoutData('user1');
    expect(result).toHaveLength(1);
    expect(result[0].exerciseName).toBe('Bench');
  });
});
