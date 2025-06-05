'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
      </div>
      <span className="text-sm">AI Coach is thinking...</span>
    </div>
  );
}
