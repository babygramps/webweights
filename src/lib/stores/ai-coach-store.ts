import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  CoachMessage,
  CoachInteractionMode,
  CoachContext,
  QuickAction,
} from '@/types/ai-coach';

interface AICoachStore {
  // State
  isOpen: boolean;
  mode: CoachInteractionMode;
  messages: CoachMessage[];
  isLoading: boolean;
  context: CoachContext;
  quickActions: QuickAction[];
  currentSessionId: string | null;
  error: string | null;

  // Actions
  openCoach: (mode?: CoachInteractionMode) => void;
  closeCoach: () => void;
  toggleCoach: () => void;
  setMode: (mode: CoachInteractionMode) => void;
  sendMessage: (message: string) => Promise<void>;
  addMessage: (message: CoachMessage) => void;
  setContext: (context: Partial<CoachContext>) => void;
  setQuickActions: (actions: QuickAction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  startNewSession: () => void;
  endSession: () => void;
}

export const useAICoachStore = create<AICoachStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isOpen: false,
        mode: 'chat',
        messages: [],
        isLoading: false,
        context: {
          mode: 'chat',
          currentPage: '/',
        },
        quickActions: [],
        currentSessionId: null,
        error: null,

        // Actions
        openCoach: (mode = 'chat') =>
          set({
            isOpen: true,
            mode,
            context: { ...get().context, mode },
          }),

        closeCoach: () =>
          set({
            isOpen: false,
            error: null,
          }),

        toggleCoach: () =>
          set((state) => ({
            isOpen: !state.isOpen,
            error: null,
          })),

        setMode: (mode) =>
          set({
            mode,
            context: { ...get().context, mode },
          }),

        sendMessage: async (content: string) => {
          const userMessage: CoachMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            timestamp: new Date(),
          };

          set((state) => ({
            messages: [...state.messages, userMessage],
            isLoading: true,
            error: null,
          }));

          try {
            const response = await fetch('/api/ai-coach/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: content,
                context: get().context,
                sessionId: get().currentSessionId,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to send message');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            const assistantMessageId = crypto.randomUUID();
            let assistantContent = '';

            const initialAssistantMessage: CoachMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
            };

            set((state) => ({
              messages: [...state.messages, initialAssistantMessage],
            }));

            if (reader) {
              let buffer = '';
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete lines in the buffer
                let newlineIndex: number;
                while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                  const line = buffer.slice(0, newlineIndex).trim();
                  buffer = buffer.slice(newlineIndex + 1);

                  if (!line) continue;

                  // OpenAI streams prepend each JSON chunk with "data: "
                  const jsonStr = line.startsWith('data:')
                    ? line.replace(/^data:\s*/, '')
                    : line;

                  if (jsonStr === '[DONE]') {
                    // Stream finished
                    break;
                  }

                  try {
                    const json = JSON.parse(jsonStr);
                    const contentPart = json.choices?.[0]?.delta?.content ?? '';

                    if (contentPart) {
                      assistantContent += contentPart;

                      // Update the assistant message incrementally
                      set((state) => ({
                        messages: state.messages.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: assistantContent }
                            : msg,
                        ),
                      }));
                    }
                  } catch (e) {
                    // If parsing fails, ignore this line but log for debugging
                    console.error(
                      'Failed to parse AI stream chunk',
                      e,
                      jsonStr,
                    );
                  }
                }
              }
            }
          } catch (error) {
            set({
              error:
                error instanceof Error ? error.message : 'An error occurred',
            });
          } finally {
            set({ isLoading: false });
          }
        },

        addMessage: (message) =>
          set((state) => ({
            messages: [...state.messages, message],
          })),

        setContext: (context) =>
          set((state) => ({
            context: { ...state.context, ...context },
          })),

        setQuickActions: (actions) => set({ quickActions: actions }),

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        clearMessages: () => set({ messages: [] }),

        startNewSession: () =>
          set({
            currentSessionId: crypto.randomUUID(),
            messages: [],
            error: null,
          }),

        endSession: async () => {
          const sessionId = get().currentSessionId;
          if (sessionId) {
            try {
              await fetch('/api/ai-coach/sessions/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              });
            } catch (error) {
              console.error('Failed to end session:', error);
            }
          }
          set({ currentSessionId: null });
        },
      }),
      {
        name: 'ai-coach-store',
        partialize: (state) => ({
          messages: state.messages.slice(-10), // Only persist last 10 messages
          context: state.context,
        }),
      },
    ),
  ),
);
