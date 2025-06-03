export type ProgressionPrimaryStrategy =
  | 'weight'
  | 'volume'
  | 'intensity'
  | 'density';

export interface ProgressionStrategy {
  primary: ProgressionPrimaryStrategy;
  secondaryAdjustments: {
    sets: boolean;
    reps: boolean;
    rir: boolean;
    rest: boolean;
  };
  constraints: {
    maintainReps?: boolean;
    maintainSets?: boolean;
    maintainRIR?: boolean;
  };
}

export interface ExerciseProgressionOverride {
  exercisePattern: 'compound' | 'isolation' | 'accessory' | string; // string for regex patterns
  strategy: ProgressionStrategy;
}

export interface ProgressionStrategyWithOverrides {
  baseStrategy: ProgressionStrategy;
  exerciseOverrides?: ExerciseProgressionOverride[];
}

// Default strategies for quick selection
export const DEFAULT_STRATEGIES: Record<string, ProgressionStrategy> = {
  strength: {
    primary: 'weight',
    secondaryAdjustments: {
      sets: false,
      reps: false,
      rir: true,
      rest: false,
    },
    constraints: {
      maintainReps: true,
      maintainSets: true,
    },
  },
  hypertrophy: {
    primary: 'volume',
    secondaryAdjustments: {
      sets: true,
      reps: true,
      rir: true,
      rest: false,
    },
    constraints: {
      maintainRIR: false,
    },
  },
  peaking: {
    primary: 'intensity',
    secondaryAdjustments: {
      sets: false,
      reps: false,
      rir: true,
      rest: true,
    },
    constraints: {
      maintainReps: true,
      maintainSets: true,
    },
  },
  conditioning: {
    primary: 'density',
    secondaryAdjustments: {
      sets: false,
      reps: false,
      rir: false,
      rest: true,
    },
    constraints: {
      maintainReps: true,
      maintainSets: true,
    },
  },
};
