import {
  ProgressionTemplate,
  IntensityParameters,
  ProgressionType,
} from '@/types/progression';

export const PROGRESSION_TEMPLATES: ProgressionTemplate[] = [
  {
    id: 'linear-strength',
    name: 'Linear Strength Progression',
    description:
      'Steady weekly increases in weight with consistent volume. Great for beginners.',
    type: 'linear',
    targetGoal: 'strength',
    difficulty: 'beginner',
    duration: 8,
    weekPattern: [
      {
        volume: 100,
        weight: 100,
        rir: 3,
        rpe: 7,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 100,
        weight: 102.5,
        rir: 2,
        rpe: 7.5,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 100,
        weight: 105,
        rir: 2,
        rpe: 8,
        sets: 1.0,
        repsModifier: 1.0,
      },
      { volume: 70, weight: 85, rir: 4, rpe: 5, sets: 0.7, repsModifier: 1.0 }, // Deload
      {
        volume: 100,
        weight: 107.5,
        rir: 2,
        rpe: 8,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 100,
        weight: 110,
        rir: 1,
        rpe: 8.5,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 100,
        weight: 112.5,
        rir: 1,
        rpe: 9,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 90,
        weight: 115,
        rir: 0,
        rpe: 9.5,
        sets: 1.0,
        repsModifier: 0.9,
      }, // Peak
    ],
  },
  {
    id: 'wave-loading',
    name: 'Wave Loading Pattern',
    description:
      'Intensity fluctuates in waves - build up, back down, repeat higher. Good for intermediate lifters.',
    type: 'wave',
    targetGoal: 'strength',
    difficulty: 'intermediate',
    duration: 6,
    weekPattern: [
      {
        volume: 100,
        weight: 100,
        rir: 3,
        rpe: 7,
        sets: 1.0,
        repsModifier: 1.0,
      },
      { volume: 95, weight: 105, rir: 2, rpe: 8, sets: 1.0, repsModifier: 1.0 },
      {
        volume: 90,
        weight: 110,
        rir: 1,
        rpe: 8.5,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 105,
        weight: 102.5,
        rir: 3,
        rpe: 7,
        sets: 1.1,
        repsModifier: 1.0,
      },
      {
        volume: 100,
        weight: 107.5,
        rir: 2,
        rpe: 8,
        sets: 1.1,
        repsModifier: 1.0,
      },
      {
        volume: 95,
        weight: 112.5,
        rir: 1,
        rpe: 9,
        sets: 1.0,
        repsModifier: 1.0,
      },
    ],
  },
  {
    id: 'block-hypertrophy',
    name: 'Block Periodization (Hypertrophy Focus)',
    description:
      'High volume accumulation followed by intensity phases. Great for muscle building.',
    type: 'block',
    targetGoal: 'hypertrophy',
    difficulty: 'intermediate',
    duration: 12,
    weekPattern: [
      // Accumulation Block (4 weeks)
      { volume: 120, weight: 95, rir: 4, rpe: 6, sets: 1.2, repsModifier: 1.1 },
      {
        volume: 125,
        weight: 95,
        rir: 3,
        rpe: 7,
        sets: 1.25,
        repsModifier: 1.1,
      },
      { volume: 130, weight: 95, rir: 3, rpe: 7, sets: 1.3, repsModifier: 1.1 },
      { volume: 80, weight: 85, rir: 5, rpe: 5, sets: 0.8, repsModifier: 1.0 }, // Deload
      // Intensification Block (4 weeks)
      {
        volume: 110,
        weight: 100,
        rir: 3,
        rpe: 7,
        sets: 1.1,
        repsModifier: 1.0,
      },
      {
        volume: 105,
        weight: 102.5,
        rir: 2,
        rpe: 8,
        sets: 1.05,
        repsModifier: 1.0,
      },
      {
        volume: 100,
        weight: 105,
        rir: 2,
        rpe: 8,
        sets: 1.0,
        repsModifier: 1.0,
      },
      { volume: 70, weight: 90, rir: 4, rpe: 6, sets: 0.7, repsModifier: 1.0 }, // Deload
      // Realization Block (4 weeks)
      {
        volume: 95,
        weight: 107.5,
        rir: 2,
        rpe: 8,
        sets: 1.0,
        repsModifier: 0.95,
      },
      {
        volume: 90,
        weight: 110,
        rir: 1,
        rpe: 8.5,
        sets: 1.0,
        repsModifier: 0.9,
      },
      {
        volume: 85,
        weight: 112.5,
        rir: 1,
        rpe: 9,
        sets: 1.0,
        repsModifier: 0.85,
      },
      {
        volume: 80,
        weight: 115,
        rir: 0,
        rpe: 9.5,
        sets: 1.0,
        repsModifier: 0.8,
      }, // Peak
    ],
  },
  {
    id: 'undulating-power',
    name: 'Daily Undulating Periodization',
    description:
      'Frequent intensity and volume changes within each week. Good for advanced athletes.',
    type: 'undulating',
    targetGoal: 'strength',
    difficulty: 'advanced',
    duration: 8,
    weekPattern: [
      {
        volume: 100,
        weight: 100,
        rir: 3,
        rpe: 7,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 120,
        weight: 95,
        rir: 4,
        rpe: 6.5,
        sets: 1.2,
        repsModifier: 1.1,
      },
      { volume: 90, weight: 105, rir: 2, rpe: 8, sets: 0.9, repsModifier: 0.9 },
      {
        volume: 110,
        weight: 98,
        rir: 3,
        rpe: 7,
        sets: 1.1,
        repsModifier: 1.05,
      },
      {
        volume: 95,
        weight: 107.5,
        rir: 2,
        rpe: 8,
        sets: 1.0,
        repsModifier: 0.95,
      },
      {
        volume: 125,
        weight: 97.5,
        rir: 3,
        rpe: 7,
        sets: 1.25,
        repsModifier: 1.1,
      },
      {
        volume: 85,
        weight: 110,
        rir: 1,
        rpe: 8.5,
        sets: 0.85,
        repsModifier: 0.9,
      },
      { volume: 70, weight: 85, rir: 4, rpe: 5, sets: 0.7, repsModifier: 1.0 }, // Deload
    ],
  },
  {
    id: 'powerlifting-peak',
    name: 'Powerlifting Competition Peak',
    description:
      'Designed to peak for a powerlifting meet. Reduces volume while maintaining/increasing intensity.',
    type: 'step',
    targetGoal: 'powerlifting',
    difficulty: 'advanced',
    duration: 6,
    weekPattern: [
      {
        volume: 100,
        weight: 100,
        rir: 3,
        rpe: 7,
        sets: 1.0,
        repsModifier: 1.0,
      },
      {
        volume: 90,
        weight: 105,
        rir: 2,
        rpe: 8,
        sets: 0.9,
        repsModifier: 0.95,
      },
      {
        volume: 80,
        weight: 110,
        rir: 1,
        rpe: 8.5,
        sets: 0.8,
        repsModifier: 0.9,
      },
      {
        volume: 70,
        weight: 115,
        rir: 1,
        rpe: 9,
        sets: 0.7,
        repsModifier: 0.85,
      },
      {
        volume: 50,
        weight: 120,
        rir: 0,
        rpe: 9.5,
        sets: 0.5,
        repsModifier: 0.7,
      },
      { volume: 30, weight: 105, rir: 3, rpe: 6, sets: 0.3, repsModifier: 0.8 }, // Opener practice
    ],
  },
  {
    id: 'hypertrophy-volume',
    name: 'High Volume Hypertrophy',
    description:
      'Maximizes muscle growth through progressive volume increases with moderate intensity.',
    type: 'linear',
    targetGoal: 'hypertrophy',
    difficulty: 'intermediate',
    duration: 10,
    weekPattern: [
      { volume: 100, weight: 95, rir: 4, rpe: 6, sets: 1.0, repsModifier: 1.0 },
      {
        volume: 105,
        weight: 95,
        rir: 3,
        rpe: 7,
        sets: 1.05,
        repsModifier: 1.0,
      },
      {
        volume: 110,
        weight: 97.5,
        rir: 3,
        rpe: 7,
        sets: 1.1,
        repsModifier: 1.0,
      },
      {
        volume: 115,
        weight: 97.5,
        rir: 2,
        rpe: 7.5,
        sets: 1.15,
        repsModifier: 1.0,
      },
      { volume: 80, weight: 90, rir: 4, rpe: 5, sets: 0.8, repsModifier: 1.0 }, // Deload
      {
        volume: 120,
        weight: 100,
        rir: 3,
        rpe: 7,
        sets: 1.2,
        repsModifier: 1.0,
      },
      {
        volume: 125,
        weight: 100,
        rir: 2,
        rpe: 7.5,
        sets: 1.25,
        repsModifier: 1.0,
      },
      {
        volume: 130,
        weight: 102.5,
        rir: 2,
        rpe: 8,
        sets: 1.3,
        repsModifier: 1.0,
      },
      {
        volume: 135,
        weight: 102.5,
        rir: 1,
        rpe: 8.5,
        sets: 1.35,
        repsModifier: 1.0,
      },
      { volume: 70, weight: 90, rir: 4, rpe: 5, sets: 0.7, repsModifier: 1.0 }, // Final deload
    ],
  },
];

export function getTemplatesByGoal(goal: string): ProgressionTemplate[] {
  return PROGRESSION_TEMPLATES.filter(
    (template) => template.targetGoal === goal,
  );
}

export function getTemplatesByDifficulty(
  difficulty: string,
): ProgressionTemplate[] {
  return PROGRESSION_TEMPLATES.filter(
    (template) => template.difficulty === difficulty,
  );
}

export function getTemplatesByType(
  type: ProgressionType,
): ProgressionTemplate[] {
  return PROGRESSION_TEMPLATES.filter((template) => template.type === type);
}

export function getTemplateById(id: string): ProgressionTemplate | undefined {
  return PROGRESSION_TEMPLATES.find((template) => template.id === id);
}

// Helper function to scale a template to different durations
export function scaleTemplate(
  template: ProgressionTemplate,
  newDuration: number,
): IntensityParameters[] {
  const originalDuration = template.weekPattern.length;
  const scaleFactor = newDuration / originalDuration;

  if (scaleFactor === 1) {
    return [...template.weekPattern];
  }

  // For now, simple repetition or truncation
  // Could be more sophisticated with interpolation
  const scaled: IntensityParameters[] = [];

  for (let week = 0; week < newDuration; week++) {
    const sourceWeek = Math.floor(week / scaleFactor);
    const templateWeek = Math.min(sourceWeek, originalDuration - 1);
    scaled.push({ ...template.weekPattern[templateWeek] });
  }

  return scaled;
}

// Apply progression template to create weekly progressions
export function applyProgressionTemplate(
  templateId: string,
  mesocycleDuration: number,
  startingIntensity?: Partial<IntensityParameters>,
): IntensityParameters[] {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let weekPattern = scaleTemplate(template, mesocycleDuration);

  // Apply starting intensity modifications if provided
  if (startingIntensity) {
    weekPattern = weekPattern.map((week) => ({
      ...week,
      ...startingIntensity,
    }));
  }

  return weekPattern;
}
