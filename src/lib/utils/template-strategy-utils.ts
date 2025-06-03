import { ProgressionTemplate } from '../progression-templates';
import {
  ProgressionStrategy,
  DEFAULT_STRATEGIES,
} from '@/types/progression-strategy';

export function getStrategyForTemplate(
  template: ProgressionTemplate,
): ProgressionStrategy {
  switch (template.targetGoal) {
    case 'strength':
      return DEFAULT_STRATEGIES.strength;
    case 'hypertrophy':
      return DEFAULT_STRATEGIES.hypertrophy;
    case 'endurance':
      return DEFAULT_STRATEGIES.conditioning;
    case 'powerlifting':
      return DEFAULT_STRATEGIES.peaking;
    default:
      return DEFAULT_STRATEGIES.hypertrophy;
  }
}
