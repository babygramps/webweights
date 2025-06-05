'use client';

import { useState } from 'react';
import { useAICoachStore } from '@/lib/stores/ai-coach-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChatInterface } from './CoachChat/ChatInterface';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachButtonProps {
  className?: string;
}

export function CoachButton({ className }: CoachButtonProps) {
  const { isOpen, openCoach, closeCoach } = useAICoachStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => openCoach()}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105',
          'bg-primary hover:bg-primary/90',
          isOpen && 'scale-0 opacity-0',
          className,
        )}
        size="icon"
      >
        <Bot className="h-6 w-6" />
        <span className="sr-only">Open AI Coach</span>
      </Button>

      {/* Mobile Sheet */}
      <Sheet
        open={isOpen && !isFullscreen}
        onOpenChange={(open) => !open && closeCoach()}
      >
        <SheetContent side="bottom" className="h-[90vh] p-0" showClose={false}>
          <ChatInterface
            className="h-full border-0 rounded-none"
            onToggleFullscreen={() => setIsFullscreen(true)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop/Fullscreen Modal */}
      {isOpen && isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-4 md:inset-8 lg:inset-12">
            <ChatInterface
              isFullscreen
              onToggleFullscreen={() => setIsFullscreen(false)}
              className="h-full shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Desktop Floating Window - for larger screens */}
      {isOpen && !isFullscreen && (
        <div className="hidden md:block">
          <div className="fixed bottom-20 right-6 z-50 w-96 shadow-2xl">
            <ChatInterface onToggleFullscreen={() => setIsFullscreen(true)} />
          </div>
        </div>
      )}
    </>
  );
}
