import logger from '@/lib/logger';
interface ExerciseProgressData {
  date: Date | string;
  workoutId?: string;
  workoutDate?: Date | string;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  volume: number;
}

export async function fetchExerciseProgressData(
  exerciseId: string,
): Promise<ExerciseProgressData[]> {
  logger.log(
    `[fetchExerciseProgressData] Starting request for exercise: ${exerciseId}`,
  );

  try {
    // Validate input
    if (!exerciseId || typeof exerciseId !== 'string') {
      logger.error(
        '[fetchExerciseProgressData] Invalid exerciseId:',
        exerciseId,
      );
      throw new Error('Invalid exercise ID provided');
    }

    logger.log('[fetchExerciseProgressData] Making API request...');
    const response = await fetch('/api/stats/exercise-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exerciseId }),
    });

    logger.log(
      `[fetchExerciseProgressData] API response status: ${response.status}`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error(
        '[fetchExerciseProgressData] API error response:',
        errorData,
      );

      if (response.status === 401) {
        throw new Error('Please log in to view exercise data');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid request');
      } else {
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`,
        );
      }
    }

    const result = await response.json();
    logger.log(
      `[fetchExerciseProgressData] Successfully received ${result.data?.length || 0} data points`,
    );

    if (!result.data || !Array.isArray(result.data)) {
      logger.error(
        '[fetchExerciseProgressData] Invalid response format:',
        result,
      );
      throw new Error('Invalid response format from server');
    }

    return result.data;
  } catch (error) {
    logger.error('[fetchExerciseProgressData] Error occurred:', error);
    logger.error('[fetchExerciseProgressData] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack available',
      exerciseId,
    });

    // Re-throw with more context
    throw new Error(
      `Failed to fetch exercise progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
