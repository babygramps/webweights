import { render } from '@testing-library/react';
import { PRCard } from '@/components/stats/PRCard';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/contexts/UserPreferencesContext', () => ({
  useUserPreferences: () => ({
    weightUnit: 'kg',
    convertWeight: (w: number) => w,
  }),
}));

describe('PRCard', () => {
  it('renders record tabs', () => {
    const { getByText } = render(
      <PRCard
        exerciseName="Bench"
        maxWeight={{ weight: 100, reps: 1, date: '2024-01-01' }}
        maxVolume={{ weight: 80, reps: 10, date: '2024-02-01' }}
        maxReps={{ weight: 60, reps: 12, date: '2024-03-01' }}
      />,
    );

    expect(getByText('Weight')).toBeInTheDocument();
    expect(getByText('Volume')).toBeInTheDocument();
    expect(getByText('Reps')).toBeInTheDocument();
  });
});
