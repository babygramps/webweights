import { describe, it, expect, vi } from 'vitest';
import { fetchExerciseProgressData } from '@/lib/utils/stats-api';

const originalFetch = global.fetch;

describe('fetchExerciseProgressData', () => {
  it('sends groupBy parameter', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    await fetchExerciseProgressData('ex1', 'workout');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/stats/exercise-progress?groupBy=workout',
      expect.objectContaining({ method: 'POST' }),
    );

    global.fetch = originalFetch;
  });
});
