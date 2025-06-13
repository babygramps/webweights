import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAICoachService } from '@/lib/ai/openai-coach';
import { db } from '@/db';
import { aiCoachSessions, aiCoachMessages } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context, sessionId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Initialize OpenAI service
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 },
      );
    }

    const aiService = new OpenAICoachService({
      apiKey,
      model: process.env.AI_MODEL || 'gpt-4.1-nano-2025-04-14',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    });

    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const [newSession] = await db
        .insert(aiCoachSessions)
        .values({
          userId: user.id,
          context,
        })
        .returning();
      currentSessionId = newSession.id;
    }

    // Save user message
    await db.insert(aiCoachMessages).values({
      sessionId: currentSessionId,
      role: 'user',
      content: message,
    });

    // Get AI response with streaming
    const response = await aiService.chat(message, {
      ...context,
      userId: user.id,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (response.stream) {
            const reader = response.stream.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              fullResponse += chunk;

              // Send chunk to client
              controller.enqueue(encoder.encode(chunk));
            }

            // Save assistant message
            await db.insert(aiCoachMessages).values({
              sessionId: currentSessionId,
              role: 'assistant',
              content: fullResponse,
              metadata:
                response.analysis || response.suggestions
                  ? {
                      analysis: response.analysis,
                      suggestions: response.suggestions,
                    }
                  : null,
            });
          } else if (response.message) {
            // Non-streaming response
            controller.enqueue(encoder.encode(response.message));

            await db.insert(aiCoachMessages).values({
              sessionId: currentSessionId,
              role: 'assistant',
              content: response.message,
            });
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Coach chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 },
    );
  }
}
