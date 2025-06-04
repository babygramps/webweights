import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkoutData } from '@/db/queries/export';

export async function GET() {
  logger.log('[API] /api/export/workouts GET request received');

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.error('[API] No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await getUserWorkoutData(user.id);

    const data = rows.map((r) => ({
      ...r,
      weight: r.weight ? Number(r.weight) : null,
      reps: r.reps ? Number(r.reps) : null,
      rir: r.rir ? Number(r.rir) : null,
      rpe: r.rpe ? Number(r.rpe) : null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('[API] Failed to export workouts:', error);
    return NextResponse.json(
      { error: 'Failed to export workouts' },
      { status: 500 },
    );
  }
}
