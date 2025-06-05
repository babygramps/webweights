import { useMutation, useQuery } from '@tanstack/react-query';
import { useAICoachStore } from '@/lib/stores/ai-coach-store';
import type {
  MesocycleParams,
  ExerciseContext,
  CoachContext,
} from '@/types/ai-coach';

export function useAIChat() {
  const { setLoading, setError } = useAICoachStore();

  return useMutation({
    mutationFn: async ({
      message,
      context,
    }: {
      message: string;
      context: CoachContext;
    }) => {
      const response = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.body;
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
    onSuccess: () => {
      setLoading(false);
    },
  });
}

export function useMesocycleAnalysis(mesocycleId: string, enabled = true) {
  return useQuery({
    queryKey: ['ai-coach', 'mesocycle-analysis', mesocycleId],
    queryFn: async () => {
      const response = await fetch('/api/ai-coach/analyze-mesocycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesocycleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze mesocycle');
      }

      return response.json();
    },
    enabled: enabled && !!mesocycleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useExerciseSuggestions(
  context: ExerciseContext,
  enabled = true,
) {
  return useQuery({
    queryKey: ['ai-coach', 'exercise-suggestions', context],
    queryFn: async () => {
      const response = await fetch('/api/ai-coach/suggest-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error('Failed to get exercise suggestions');
      }

      return response.json();
    },
    enabled: enabled && context.muscleGroups.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useGenerateMesocycle() {
  return useMutation({
    mutationFn: async (params: MesocycleParams) => {
      const response = await fetch('/api/ai-coach/generate-mesocycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mesocycle');
      }

      return response.json();
    },
  });
}

export function useRecoveryAnalysis(enabled = false) {
  return useQuery({
    queryKey: ['ai-coach', 'recovery-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/ai-coach/analyze-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze recovery');
      }

      return response.json();
    },
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
