import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { getDashboardOverview } from '@/db/queries/dashboard';
import {
  getRecentWorkouts,
  getWorkoutCompletionRate,
  getPersonalRecords,
} from '@/db/queries/stats';

// eslint-disable-next-line no-var
var selectMock: Mock;
vi.mock('@/db/queries/stats');
vi.mock('@/db/index', () => {
  selectMock = vi.fn();
  return {
    db: { select: selectMock },
    mesocycles: {},
    workouts: {},
  };
});

type QueryResult = Record<string, unknown>[];
function createSelect(result: QueryResult) {
  const terminalObj = {
    where: () => ({
      orderBy: () => ({
        limit: () => Promise.resolve(result),
      }),
    }),
  };

  return () => ({
    from: () => ({
      ...terminalObj,
      innerJoin: () => terminalObj,
    }),
  });
}

describe('getDashboardOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates dashboard data', async () => {
    vi.setSystemTime(new Date('2024-01-10'));
    selectMock.mockImplementationOnce(
      createSelect([{ id: 'm1', startDate: '2024-01-01', weeks: 4 }]),
    );
    selectMock.mockImplementationOnce(
      createSelect([{ id: 'w1', label: 'Push Day' }]),
    );
    selectMock.mockImplementationOnce(
      createSelect([{ name: 'Bench Press' }, { name: 'Overhead Press' }]),
    );

    (getRecentWorkouts as Mock).mockResolvedValue([{ workoutId: 'w1' }]);
    (getWorkoutCompletionRate as Mock).mockResolvedValue({
      totalWorkouts: 5,
    });
    (getPersonalRecords as Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await getDashboardOverview('user1');

    expect(result).toEqual({
      currentWeek: 2,
      totalWorkouts: 5,
      nextWorkout: {
        id: 'w1',
        label: 'Push Day',
        exercises: ['Bench Press', 'Overhead Press'],
      },
      personalRecords: 2,
      recentWorkouts: [{ workoutId: 'w1' }],
    });
  });

  it('handles missing mesocycle', async () => {
    selectMock.mockImplementationOnce(createSelect([]));

    (getRecentWorkouts as Mock).mockResolvedValue([]);
    (getWorkoutCompletionRate as Mock).mockResolvedValue({
      totalWorkouts: 0,
    });
    (getPersonalRecords as Mock).mockResolvedValue([]);

    const result = await getDashboardOverview('user1');

    expect(result.currentWeek).toBeNull();
    expect(result.nextWorkout).toBeUndefined();
  });
});
