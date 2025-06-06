import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getUpcomingWorkouts } from '@/db/queries/workouts';

// eslint-disable-next-line no-var
var selectMock: Mock;
vi.mock('@/db/index', () => {
  selectMock = vi.fn();
  return {
    db: { select: selectMock },
    workouts: {},
    mesocycles: {},
  };
});

type QueryResult = Record<string, unknown>[];
function createSelect(result: QueryResult) {
  return () => ({
    from: () => ({
      innerJoin: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(result),
          }),
        }),
      }),
    }),
  });
}

describe('getUpcomingWorkouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns workouts scheduled from today onward', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-10'));
    selectMock.mockImplementationOnce(createSelect([{ id: 'w1' }]));

    const result = await getUpcomingWorkouts('user1');

    expect(result).toEqual([{ id: 'w1' }]);
    expect(selectMock).toHaveBeenCalled();
  });
});
