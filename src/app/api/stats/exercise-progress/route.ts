import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getExerciseProgress } from '@/db/queries/stats';

export async function POST(request: NextRequest) {
  console.log('[API] /api/stats/exercise-progress POST request received');

  try {
    // Parse request body
    const body = await request.json();
    const { exerciseId } = body;

    console.log('[API] Request body:', { exerciseId });

    // Validate input
    if (!exerciseId || typeof exerciseId !== 'string') {
      console.error('[API] Invalid exerciseId:', exerciseId);
      return NextResponse.json(
        { error: 'Invalid exercise ID provided' },
        { status: 400 },
      );
    }

    console.log('[API] Creating Supabase client...');
    const supabase = await createClient();

    console.log('[API] Getting user authentication...');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[API] No authenticated user found');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 },
      );
    }

    console.log(
      `[API] Fetching progress for user: ${user.id}, exercise: ${exerciseId}`,
    );
    const progressData = await getExerciseProgress(user.id, exerciseId, 6);

    console.log(
      `[API] Successfully fetched ${progressData.length} data points`,
    );

    const result = progressData.map((d) => ({
      date: d.date || new Date(),
      weight: Number(d.weight) || 0,
      reps: Number(d.reps) || 0,
      rir: d.rir ? Number(d.rir) : undefined,
      rpe: d.rpe ? Number(d.rpe) : undefined,
      volume: Number(d.volume) || 0,
    }));

    console.log(`[API] Returning processed data with ${result.length} items`);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[API] Error occurred:', error);
    console.error(
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
