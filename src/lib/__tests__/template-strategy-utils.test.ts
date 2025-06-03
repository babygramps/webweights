import { describe, it, expect } from 'vitest';
import { PROGRESSION_TEMPLATES } from '../progression-templates';
import { getStrategyForTemplate } from '../utils/template-strategy-utils';
import { DEFAULT_STRATEGIES } from '@/types/progression-strategy';

describe('template to strategy mapping', () => {
  it('maps strength template to strength strategy', () => {
    const tpl = PROGRESSION_TEMPLATES.find((t) => t.targetGoal === 'strength');
    if (!tpl) throw new Error('No strength template');
    const strategy = getStrategyForTemplate(tpl);
    expect(strategy).toEqual(DEFAULT_STRATEGIES.strength);
  });

  it('maps hypertrophy template to hypertrophy strategy', () => {
    const tpl = PROGRESSION_TEMPLATES.find(
      (t) => t.targetGoal === 'hypertrophy',
    );
    if (!tpl) throw new Error('No hypertrophy template');
    const strategy = getStrategyForTemplate(tpl);
    expect(strategy).toEqual(DEFAULT_STRATEGIES.hypertrophy);
  });
});
