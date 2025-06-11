import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { StatsPageClient } from '@/app/stats/StatsPageClient';
import type {
  MuscleGroup,
  RecentWorkout,
  VolumeData,
  CompletionRate,
  WeeklyCompletion,
  PersonalRecord,
  UserExercise,
} from '@/lib/types/stats';
import type { DateRange } from 'react-day-picker';
import React from 'react';

// Mock StatsFilters to immediately trigger a date range change
vi.mock('@/components/stats/StatsFilters', () => {
  return {
    StatsFilters: ({
      onDateRangeChange,
    }: {
      onDateRangeChange?: (range: DateRange | undefined) => void;
    }) => {
      React.useEffect(() => {
        const range: DateRange = {
          from: new Date(2023, 0, 1),
          to: new Date(2023, 2, 1), // 2 months span
        };
        onDateRangeChange?.(range);
      }, [onDateRangeChange]);
      return <div data-testid="stats-filters" />;
    },
  };
});

// Mock MuscleGroupChart to avoid heavy rendering
vi.mock('@/components/stats/MuscleGroupChart', () => {
  return {
    MuscleGroupChart: () => <div data-testid="muscle-chart" />,
  };
});

// Mock user preference hook
vi.mock('@/lib/contexts/UserPreferencesContext', () => {
  return {
    useUserPreferences: () => ({
      weightUnit: 'kg',
      convertWeight: (w: number) => w,
    }),
  };
});

// Lightweight stubs for other heavy components used in StatsPageClient
vi.mock('@/components/stats/StatsCard', () => ({ StatsCard: () => <div /> }));
vi.mock('@/components/stats/PRCard', () => ({ PRCard: () => <div /> }));
vi.mock('@/components/stats/ProgressChart', () => ({
  ProgressChart: () => <div />,
}));
vi.mock('@/components/stats/OneRMCalculator', () => ({
  OneRMCalculator: () => <div />,
}));
vi.mock('@/components/stats/ExerciseStats', () => ({
  ExerciseStats: () => <div />,
}));
vi.mock('@/components/stats/OneRMProgressChart', () => ({
  OneRMProgressChart: () => <div />,
}));
vi.mock('@/components/stats/ExportWorkoutsButton', () => ({
  ExportWorkoutsButton: () => <div />,
}));

// Helper to create empty data arrays of correct types
const createProps = () => {
  const recentWorkouts: RecentWorkout[] = [];
  const personalRecords: PersonalRecord[] = [];
  const volumeData: VolumeData[] = [];
  const muscleDistribution: MuscleGroup[] = [
    { primaryMuscle: 'Chest', setCount: 10, totalVolume: 1000 },
  ];
  const completionRate: CompletionRate = {
    completedWorkouts: 0,
    completionRate: 0,
  };
  const userExercises: UserExercise[] = [];
  const weeklyCompletion: WeeklyCompletion[] = [];
  return {
    recentWorkouts,
    personalRecords,
    volumeData,
    muscleDistribution,
    completionRate,
    userExercises,
    weeklyCompletion,
    totalVolume: 0,
    avgSetsPerWorkout: 0,
  } as const;
};

describe('StatsPageClient - Muscle Group Time Filter', () => {
  it('fetches updated muscle distribution when date range changes', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        json: () => Promise.resolve({ data: [] }),
        ok: true,
      } as Response);

    render(<StatsPageClient {...createProps()} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const calledUrl = (fetchMock.mock.calls[0][0] as string) ?? '';
    expect(calledUrl).toContain('/api/stats/muscle-distribution');

    const expectedFrom = new Date(2023, 0, 1).toISOString().split('T')[0];
    const expectedTo = new Date(2023, 2, 1).toISOString().split('T')[0];
    expect(calledUrl).toContain(`from=${expectedFrom}`);
    expect(calledUrl).toContain(`to=${expectedTo}`);

    fetchMock.mockRestore();
  });
});
