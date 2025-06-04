import { describe, it, expect, vi, type Mock } from 'vitest';
import { fetchStats } from '@/lib/api/stats';
import {
  getRecentWorkouts,
  getPersonalRecords,
  getVolumeProgressData,
  getMuscleGroupDistribution,
  getWorkoutCompletionRate,
  getUserExercises,
  getWeeklyCompletionData,
} from '@/db/queries/stats';

vi.mock('@/db/queries/stats');

describe('fetchStats', () => {
  it('returns aggregated stats data', async () => {
    (getRecentWorkouts as Mock).mockResolvedValue([]);
    (getPersonalRecords as Mock).mockResolvedValue([]);
    (getVolumeProgressData as Mock).mockResolvedValue([]);
    (getMuscleGroupDistribution as Mock).mockResolvedValue([]);
    (getWorkoutCompletionRate as Mock).mockResolvedValue({
      completedWorkouts: 5,
      completionRate: 50,
    });
    (getUserExercises as Mock).mockResolvedValue([]);
    (getWeeklyCompletionData as Mock).mockResolvedValue([
      {
        week: '2024-05-06',
        completedWorkouts: 1,
        totalWorkouts: 2,
        completionRate: 50,
      },
    ]);

    const result = await fetchStats('user1');

    expect(result.weeklyCompletion).toHaveLength(1);
    expect(getWeeklyCompletionData).toHaveBeenCalledWith('user1');
  });
});
