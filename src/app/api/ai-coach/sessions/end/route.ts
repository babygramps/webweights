import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { aiCoachSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 },
      );
    }

    // Update session end time
    const [updatedSession] = await db
      .update(aiCoachSessions)
      .set({
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiCoachSessions.id, sessionId),
          eq(aiCoachSessions.userId, user.id),
        ),
      )
      .returning();

    if (!updatedSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 },
    );
  }
}
