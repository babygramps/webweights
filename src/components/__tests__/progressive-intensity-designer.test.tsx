import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressiveIntensityDesigner } from '../mesocycles/progressive-intensity-designer';

function noop() {}

describe('ProgressiveIntensityDesigner tabs', () => {
  it('starts on template tab when no initial progression', () => {
    render(
      <ProgressiveIntensityDesigner
        mesocycleWeeks={4}
        onProgressionChange={noop}
      />,
    );
    const templateTab = screen.getByRole('tab', { name: /templates/i });
    expect(templateTab).toHaveAttribute('data-state', 'active');
  });

  it('switches to chart after applying a template', () => {
    render(
      <ProgressiveIntensityDesigner
        mesocycleWeeks={4}
        onProgressionChange={noop}
      />,
    );
    const applyButton = screen.getAllByRole('button', {
      name: /apply template/i,
    })[0];
    fireEvent.click(applyButton);
    const chartTab = screen.getByRole('tab', { name: /chart/i });
    expect(chartTab).toHaveAttribute('data-state', 'active');
  });
});
