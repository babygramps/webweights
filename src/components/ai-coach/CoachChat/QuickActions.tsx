'use client';

import { useAICoachStore } from '@/lib/stores/ai-coach-store';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dumbbell,
  TrendingUp,
  Calendar,
  MessageSquare,
  Activity,
  Target,
} from 'lucide-react';

export function QuickActions() {
  const pathname = usePathname();
  const { sendMessage } = useAICoachStore();

  // Generate context-aware quick actions based on current page
  const getContextualActions = () => {
    const baseActions = [];

    if (pathname.includes('/dashboard')) {
      baseActions.push(
        {
          id: 'analyze-progress',
          label: 'Analyze my progress',
          icon: <TrendingUp className="h-4 w-4" />,
          action: () =>
            sendMessage('Can you analyze my recent training progress?'),
          category: 'analysis' as const,
        },
        {
          id: 'next-workout',
          label: "What's next?",
          icon: <Calendar className="h-4 w-4" />,
          action: () =>
            sendMessage('What should I focus on in my next workout?'),
          category: 'planning' as const,
        },
      );
    }

    if (pathname.includes('/logger')) {
      baseActions.push(
        {
          id: 'form-check',
          label: 'Check my form',
          icon: <Activity className="h-4 w-4" />,
          action: () =>
            sendMessage('Can you give me form tips for my current exercise?'),
          category: 'training' as const,
        },
        {
          id: 'adjust-weight',
          label: 'Adjust intensity',
          icon: <Target className="h-4 w-4" />,
          action: () =>
            sendMessage('Should I adjust the weight for my next set?'),
          category: 'training' as const,
        },
      );
    }

    if (pathname.includes('/mesocycles')) {
      baseActions.push({
        id: 'create-program',
        label: 'Create program',
        icon: <Dumbbell className="h-4 w-4" />,
        action: () => sendMessage('Help me create a new training program'),
        category: 'planning' as const,
      });
    }

    // Always available actions
    baseActions.push({
      id: 'general-advice',
      label: 'Training advice',
      icon: <MessageSquare className="h-4 w-4" />,
      action: () =>
        sendMessage('Give me some training advice based on my recent workouts'),
      category: 'training' as const,
    });

    return baseActions;
  };

  const contextualActions = getContextualActions();

  if (contextualActions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {contextualActions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={action.action}
          className="h-8 text-xs"
        >
          {action.icon}
          <span className="ml-1">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
