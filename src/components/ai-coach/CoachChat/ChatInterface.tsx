'use client';

import { useEffect, useRef } from 'react';
import { useAICoachStore } from '@/lib/stores/ai-coach-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { QuickActions } from './QuickActions';
import { TypingIndicator } from './TypingIndicator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function ChatInterface({
  className,
  isFullscreen = false,
  onToggleFullscreen,
}: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    error,
    closeCoach,
    sendMessage,
    startNewSession,
  } = useAICoachStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start a new session when the chat interface is opened
    if (messages.length === 0) {
      startNewSession();
    }
  }, [messages.length, startNewSession]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card
      className={cn(
        'flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isFullscreen ? 'h-screen' : 'h-[600px]',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-lg font-semibold">AI Coach</h3>
          <p className="text-sm text-muted-foreground">
            Your personal weightlifting assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="h-8 w-8"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCoach}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 space-y-3">
        <QuickActions />
        <MessageInput
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder="Ask me about training, form, recovery..."
        />
      </div>
    </Card>
  );
}
