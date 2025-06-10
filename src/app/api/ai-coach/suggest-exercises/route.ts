import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAICoachService } from '@/lib/ai/openai-coach';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { muscleGroups, equipment, goals } = await req.json();

    if (
      !muscleGroups ||
      !Array.isArray(muscleGroups) ||
      muscleGroups.length === 0
    ) {
      return NextResponse.json(
        { error: 'Muscle groups required' },
        { status: 400 },
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

    // Get exercise suggestions
    const suggestions = await aiService.suggestExercises({
      muscleGroups,
      equipment: equipment || [],
      goals: goals || [],
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Exercise suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest exercises' },
      { status: 500 },
    );
  }
}
