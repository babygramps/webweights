'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import type { CoachMessage } from '@/types/ai-coach';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageListProps {
  messages: CoachMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bot className="h-12 w-12 text-muted-foreground mb-4" />
        <h4 className="text-lg font-medium">Hi! I&apos;m your AI Coach</h4>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          I can help you create training programs, analyze your progress,
          suggest exercises, and answer questions about weightlifting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageItem({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex max-w-[75%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'prose prose-invert max-w-none rounded-lg px-3 py-2',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          <ReactMarkdown
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore ReactMarkdown plugin type mismatch
            remarkPlugins={[remarkGfm as unknown]}
            components={{
              // Prevent h1/h2 from being too large inside chat bubble
              h1: (props) => (
                <h4 {...props} className="text-lg font-semibold" />
              ),
              h2: (props) => (
                <h5 {...props} className="text-base font-semibold" />
              ),
              // Ensure tables, code blocks, etc., wrap properly
              table: (props) => (
                <table {...props} className="w-full text-left" />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>

        {/* Render metadata if available */}
        {message.metadata?.suggestions && (
          <div className="mt-2 space-y-1">
            {message.metadata.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-md border bg-background p-2 text-sm"
              >
                <p className="font-medium">{suggestion.title}</p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
