import { describe, it, expect } from 'vitest';
import {
  PROGRESSION_TEMPLATES,
  getTemplatesByGoal,
  getTemplatesByDifficulty,
  getTemplatesByType,
  getTemplateById,
  scaleTemplate,
  applyProgressionTemplate,
} from '../progression-templates';

describe('progression templates helpers', () => {
  it('filters templates by attributes', () => {
    expect(getTemplatesByGoal('strength').length).toBe(3);
    expect(getTemplatesByGoal('powerlifting').length).toBe(1);
    expect(getTemplatesByDifficulty('intermediate').length).toBe(3);
    expect(getTemplatesByType('linear').length).toBe(2);
  });

  it('retrieves template by id', () => {
    const tpl = getTemplateById('linear-strength');
    expect(tpl?.name).toBe('Linear Strength Progression');
  });

  it('scales templates to new duration', () => {
    const tpl = PROGRESSION_TEMPLATES[0];
    const scaled = scaleTemplate(tpl, 4);
    expect(scaled).toHaveLength(4);
    expect(scaled[0]).toEqual(tpl.weekPattern[0]);
  });

  it('applies template with overrides', () => {
    const weeks = applyProgressionTemplate('linear-strength', 3, {
      weight: 110,
    });
    expect(weeks).toHaveLength(3);
    weeks.forEach((week) => expect(week.weight).toBe(110));
  });
});
