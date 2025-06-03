import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MesocycleEditWizard } from '../mesocycles/mesocycle-edit-wizard';
import { parseLocalDate } from '@/lib/utils/date';
import { format } from 'date-fns';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => {
  const workouts = [
    {
      id: 'w1',
      label: 'Workout 1',
      scheduled_for: '2024-01-01',
      week_number: 1,
    },
    {
      id: 'w2',
      label: 'Workout 2',
      scheduled_for: '2024-01-02',
      week_number: 1,
    },
  ];
  return {
    createClient: () => ({
      from(table: string) {
        return {
          select(_fields: string, opts?: Record<string, unknown>) {
            if (table === 'workouts' && opts?.count) {
              return {
                eq() {
                  return { count: workouts.length };
                },
              };
            }
            return {
              eq() {
                if (table === 'workouts') {
                  return {
                    order() {
                      return { data: workouts, error: null };
                    },
                  };
                }
                return {
                  single() {
                    if (table === 'mesocycles') {
                      return {
                        data: {
                          id: 'm1',
                          title: 'Test',
                          weeks: 4,
                          start_date: '2024-01-01',
                        },
                        error: null,
                      };
                    }
                    if (table === 'mesocycle_progressions') {
                      return { data: null, error: null };
                    }
                    return { data: null, error: null };
                  },
                };
              },
            };
          },
        };
      },
    }),
  };
});

describe('MesocycleEditWizard', () => {
  it('displays existing workouts list', async () => {
    render(<MesocycleEditWizard mesocycleId="m1" initialStep={1} />);
    await waitFor(() => {
      expect(screen.getByText('Existing Workouts')).toBeInTheDocument();
    });
    expect(screen.getByText('Workout 1')).toBeInTheDocument();
    expect(screen.getByText('Workout 2')).toBeInTheDocument();
    const date = parseLocalDate('2024-01-01');
    expect(screen.getByText(format(date, 'PPP'))).toBeInTheDocument();
  });
});
