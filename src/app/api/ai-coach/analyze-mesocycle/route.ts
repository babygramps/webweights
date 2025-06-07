import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAICoachService } from '@/lib/ai/openai-coach';
import { db } from '@/db';
import { mesocycles, aiInsights } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mesocycleId } = await req.json();

    if (!mesocycleId) {
      return NextResponse.json(
        { error: 'Mesocycle ID required' },
        { status: 400 },
      );
    }

    // Verify user owns the mesocycle
    const [mesocycle] = await db
      .select()
      .from(mesocycles)
      .where(eq(mesocycles.id, mesocycleId))
      .limit(1);

    if (!mesocycle || mesocycle.userId !== user.id) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 },
      );
    }

    // Initialize AI service
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 },
      );
    }

    const aiService = new OpenAICoachService({
      apiKey,
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    });

    // Analyze mesocycle
    const analysis = await aiService.analyzeMesocycleProgress(mesocycleId);

    // Save insight to database
    await db.insert(aiInsights).values({
      userId: user.id,
      type: 'progress',
      targetType: 'mesocycle',
      targetId: mesocycleId,
      insight: analysis,
      score: String(analysis.progressScore),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Mesocycle analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze mesocycle' },
      { status: 500 },
    );
  }
}
