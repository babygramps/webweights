import logger from '@/lib/logger';
import { ProgressionStrategy } from '@/types/progression-strategy';
import { WeekIntensity, DEFAULT_INTENSITY } from '@/types/progression';
import { WorkoutExerciseTemplate } from '@/components/mesocycles/workout-template-designer';

// Define ExerciseDefaults type matching the one from workout-week-preview
export type ExerciseDefaults = {
  sets: number;
  reps: string;
  rir?: number;
  rpe?: number;
  rest: string;
  intensityModifier?: string;
};

// Helper function to apply reps modifier to rep strings like "8-10"
function applyRepsModifier(reps: string, modifier: number): string {
  logger.log('[applyRepsModifier] Input:', { reps, modifier });

  if (modifier === 1.0) return reps;

  // Handle range format (e.g., "8-10")
  if (reps.includes('-')) {
    const [min, max] = reps.split('-').map(Number);
    const newMin = Math.round(min * modifier);
    const newMax = Math.round(max * modifier);
    return `${newMin}-${newMax}`;
  }

  // Handle single number
  const repsNum = parseInt(reps);
  if (!isNaN(repsNum)) {
    return Math.round(repsNum * modifier).toString();
  }

  return reps;
}

export interface EnhancedExerciseDefaults extends ExerciseDefaults {
  weight?: number; // Weight modifier percentage
  intensityDescription?: string; // Description of what's changing
}

export function applyProgressionStrategyToExercise(
  exercise: WorkoutExerciseTemplate,
  weekIntensity: WeekIntensity | null,
  progressionStrategy?: ProgressionStrategy,
  exerciseType?: 'compound' | 'isolation' | 'accessory',
): EnhancedExerciseDefaults {
  logger.log('[applyProgressionStrategyToExercise] Input:', {
    exerciseName: exercise.exerciseName,
    weekIntensity,
    progressionStrategy,
    exerciseType,
  });

  if (!weekIntensity || !progressionStrategy) {
    return exercise.defaults;
  }

  const { intensity } = weekIntensity;

  // Start with original values
  let modifiedSets = exercise.defaults.sets;
  let modifiedReps = exercise.defaults.reps;
  let modifiedRir = exercise.defaults.rir;
  let modifiedRpe = exercise.defaults.rpe;
  let modifiedRest = exercise.defaults.rest;
  let weightModifier = 100; // Default to 100% (no change)

  const changes: string[] = [];

  // Apply primary progression strategy
  switch (progressionStrategy.primary) {
    case 'weight':
      // Weight progression: increase weight, maintain volume
      weightModifier = intensity.weight;
      if (weightModifier !== 100) {
        changes.push(`${weightModifier}% weight`);
      }

      // Apply RIR adjustment if allowed
      if (
        progressionStrategy.secondaryAdjustments.rir &&
        intensity.rir !== DEFAULT_INTENSITY.rir
      ) {
        const rirAdjustment = DEFAULT_INTENSITY.rir - intensity.rir;
        if (exercise.defaults.rir !== undefined) {
          modifiedRir = Math.max(0, exercise.defaults.rir - rirAdjustment);
          changes.push(`RIR ${modifiedRir}`);
        }
      }
      break;

    case 'volume':
      // Volume progression: increase sets/reps, maintain weight
      weightModifier = 100; // Keep weight constant

      if (
        progressionStrategy.secondaryAdjustments.sets &&
        intensity.sets !== 1.0
      ) {
        modifiedSets = Math.round(exercise.defaults.sets * intensity.sets);
        if (modifiedSets !== exercise.defaults.sets) {
          changes.push(`${modifiedSets} sets`);
        }
      }

      if (
        progressionStrategy.secondaryAdjustments.reps &&
        intensity.repsModifier !== 1.0
      ) {
        modifiedReps = applyRepsModifier(
          exercise.defaults.reps,
          intensity.repsModifier,
        );
        if (modifiedReps !== exercise.defaults.reps) {
          changes.push(`${modifiedReps} reps`);
        }
      }

      // Still allow RIR changes for volume progression
      if (
        progressionStrategy.secondaryAdjustments.rir &&
        intensity.rir !== DEFAULT_INTENSITY.rir
      ) {
        const rirAdjustment = DEFAULT_INTENSITY.rir - intensity.rir;
        if (exercise.defaults.rir !== undefined) {
          modifiedRir = Math.max(0, exercise.defaults.rir - rirAdjustment);
          changes.push(`RIR ${modifiedRir}`);
        }
      }
      break;

    case 'intensity':
      // Intensity progression: decrease RIR/increase RPE, maintain volume
      const rirAdjustment = DEFAULT_INTENSITY.rir - intensity.rir;

      if (exercise.defaults.rir !== undefined) {
        modifiedRir = Math.max(0, exercise.defaults.rir - rirAdjustment);
        changes.push(`RIR ${modifiedRir}`);
      } else if (exercise.defaults.rpe !== undefined) {
        modifiedRpe = Math.min(
          10,
          exercise.defaults.rpe + (intensity.rpe - DEFAULT_INTENSITY.rpe),
        );
        changes.push(`RPE ${modifiedRpe}`);
      }

      // Small weight increase might still be allowed
      if (
        progressionStrategy.secondaryAdjustments.rir &&
        intensity.weight > 100
      ) {
        weightModifier = Math.min(intensity.weight, 105); // Cap at 5% increase for intensity focus
        changes.push(`${weightModifier}% weight`);
      }
      break;

    case 'density':
      // Density progression: maintain work, decrease rest times
      if (
        progressionStrategy.secondaryAdjustments.rest &&
        exercise.defaults.rest
      ) {
        // Parse rest time from string (e.g., "90s" -> 90)
        const originalRest = parseInt(exercise.defaults.rest);
        if (!isNaN(originalRest)) {
          // Reduce rest time by up to 30% over the mesocycle
          const restReduction = 1 - (intensity.volume / 100) * 0.3;
          const newRest = Math.max(
            30,
            Math.round(originalRest * restReduction),
          );
          modifiedRest = `${newRest}s`;
          if (modifiedRest !== exercise.defaults.rest) {
            changes.push(`${newRest}s rest`);
          }
        }
      }
      break;
  }

  // Apply constraints
  if (progressionStrategy.constraints.maintainReps) {
    modifiedReps = exercise.defaults.reps;
  }
  if (progressionStrategy.constraints.maintainSets) {
    modifiedSets = exercise.defaults.sets;
  }
  if (progressionStrategy.constraints.maintainRIR) {
    modifiedRir = exercise.defaults.rir;
  }

  // Build result
  const result: EnhancedExerciseDefaults = {
    sets: modifiedSets,
    reps: modifiedReps,
    rir: modifiedRir,
    rpe: modifiedRpe,
    rest: modifiedRest,
    weight: weightModifier,
    intensityDescription: changes.length > 0 ? changes.join(' • ') : undefined,
  };

  logger.log('[applyProgressionStrategyToExercise] Result:', result);

  return result;
}

// Function to determine exercise type based on name
export function determineExerciseType(
  exerciseName: string | undefined,
): 'compound' | 'isolation' | 'accessory' {
  if (!exerciseName) {
    return 'accessory'; // Default for undefined names
  }

  const compoundPatterns = [
    /squat/i,
    /bench/i,
    /deadlift/i,
    /press/i,
    /row/i,
    /pull.*up/i,
    /chin.*up/i,
    /dip/i,
  ];

  const isolationPatterns = [
    /curl/i,
    /extension/i,
    /fly/i,
    /raise/i,
    /shrug/i,
    /calf/i,
  ];

  for (const pattern of compoundPatterns) {
    if (pattern.test(exerciseName)) {
      return 'compound';
    }
  }

  for (const pattern of isolationPatterns) {
    if (pattern.test(exerciseName)) {
      return 'isolation';
    }
  }

  return 'accessory';
}
