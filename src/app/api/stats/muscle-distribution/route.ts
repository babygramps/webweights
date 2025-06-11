import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getMuscleGroupDistribution,
  getMuscleGroupDistributionBetweenDates,
} from '@/db/queries/stats';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const monthsParam = searchParams.get('months');
    const months = monthsParam ? parseInt(monthsParam, 10) : 1;

    // Auth
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
      distribution = await getMuscleGroupDistributionBetweenDates(
        user.id,
        from,
        toDate,
      );
    } else {
      const monthsClamped = Number.isNaN(months) || months < 1 ? 1 : months;
      distribution = await getMuscleGroupDistribution(user.id, monthsClamped);
    }

    return NextResponse.json({ data: distribution });
  } catch (error) {
    console.error('[muscle-distribution] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
