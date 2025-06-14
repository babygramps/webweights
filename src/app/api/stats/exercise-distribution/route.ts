import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getExerciseDistributionByMuscle,
  getExerciseDistributionByMuscleBetweenDates,
} from '@/db/queries/stats';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const muscleGroup = searchParams.get('muscleGroup');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const monthsParam = searchParams.get('months');
    const months = monthsParam ? parseInt(monthsParam, 10) : 1;

    if (!muscleGroup) {
      return NextResponse.json(
        { error: 'muscleGroup is required' },
        { status: 400 },
      );
    }

    // Get current user via Supabase auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let distribution;
    if (from) {
      const toDate = to ?? new Date().toISOString().split('T')[0];
      distribution = await getExerciseDistributionByMuscleBetweenDates(
        user.id,
        muscleGroup,
        from,
        toDate,
      );
    } else {
      distribution = await getExerciseDistributionByMuscle(
        user.id,
        muscleGroup,
        months,
      );
    }

    return NextResponse.json({ data: distribution });
  } catch (err) {
    console.error('[exercise-distribution] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
