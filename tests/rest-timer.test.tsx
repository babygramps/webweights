import { render, screen, fireEvent } from '@testing-library/react';
import { RestTimer } from '@/components/logger/rest-timer';
import { useUserPreferences } from '@/lib/stores/user-preferences';
import { describe, it, expect, afterEach } from 'vitest';

describe('RestTimer Notification', () => {
  afterEach(() => {
    useUserPreferences.getState().setRestTimerNotification('sound');
  });

  it('updates preference when selecting option', async () => {
    render(<RestTimer />);
    const trigger = screen.getByLabelText('Notification');
    fireEvent.click(trigger);
    const noneOption = await screen.findByText('None');
    fireEvent.click(noneOption);

    expect(useUserPreferences.getState().restTimerNotification).toBe('none');
  });
});
