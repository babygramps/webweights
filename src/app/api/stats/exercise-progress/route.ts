import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getExerciseProgress } from '@/db/queries/stats';

export async function POST(request: NextRequest) {
  logger.log('[API] /api/stats/exercise-progress POST request received');

  try {
    // Parse request body
    const body = await request.json();
    const { exerciseId } = body;
    const groupBy = request.nextUrl.searchParams.get('groupBy');
    const groupByWorkout = groupBy === 'workout';

    logger.log('[API] Request body:', { exerciseId });

    // Validate input
    if (!exerciseId || typeof exerciseId !== 'string') {
      logger.error('[API] Invalid exerciseId:', exerciseId);
      return NextResponse.json(
        { error: 'Invalid exercise ID provided' },
        { status: 400 },
      );
    }

    logger.log('[API] Creating Supabase client...');
    const supabase = await createClient();

    logger.log('[API] Getting user authentication...');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error('[API] No authenticated user found');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 },
      );
    }

    logger.log(
      `[API] Fetching progress for user: ${user.id}, exercise: ${exerciseId}, groupByWorkout: ${groupByWorkout}`,
    );
    type ProgressRow = {
      date: string | Date;
      weight: number;
      reps: number;
      rir?: number | null;
      rpe?: number | null;
      volume: number;
      sets?: number;
    };

    const progressData = (await getExerciseProgress(
      user.id,
      exerciseId,
      6,
      groupByWorkout,
    )) as ProgressRow[];

    logger.log(`[API] Successfully fetched ${progressData.length} data points`);

    const result = progressData.map((d) => ({
      date: d.date || new Date(),
      weight: Number(d.weight) || 0,
      reps: Number(d.reps) || 0,
      rir: d.rir ? Number(d.rir) : undefined,
      rpe: d.rpe ? Number(d.rpe) : undefined,
      volume: Number(d.volume) || 0,
      sets: 'sets' in d ? Number((d as { sets?: number }).sets) : undefined,
    }));

    logger.log(`[API] Returning processed data with ${result.length} items`);
    return NextResponse.json({ data: result });
  } catch (error) {
    logger.error('[API] Error occurred:', error);
    logger.error(
      '[API] Error stack:',
      error instanceof Error ? error.stack : 'No stack available',
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch exercise progress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
