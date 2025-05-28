/**
 * 1RM Calculator utilities
 * Implements various formulas for estimating one-rep max
 */

export interface OneRMFormula {
  name: string;
  calculate: (weight: number, reps: number) => number;
}

// Epley Formula: 1RM = w(1 + r/30)
export const epleyFormula: OneRMFormula = {
  name: 'Epley',
  calculate: (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  },
};

// Brzycki Formula: 1RM = w × (36 / (37 - r))
export const brzyckiFormula: OneRMFormula = {
  name: 'Brzycki',
  calculate: (weight: number, reps: number) => {
    if (reps === 1) return weight;
    if (reps >= 37) return 0; // Formula breaks down
    return Math.round(weight * (36 / (37 - reps)));
  },
};

// Lombardi Formula: 1RM = w × r^0.10
export const lombardiFormula: OneRMFormula = {
  name: 'Lombardi',
  calculate: (weight: number, reps: number) => {
    return Math.round(weight * Math.pow(reps, 0.1));
  },
};

// O'Conner Formula: 1RM = w × (1 + r/40)
export const oconnerFormula: OneRMFormula = {
  name: "O'Conner",
  calculate: (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 40));
  },
};

// Mayhew Formula: 1RM = (100 × w) / (52.2 + 41.9 × e^(-0.055 × r))
export const mayhewFormula: OneRMFormula = {
  name: 'Mayhew',
  calculate: (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return Math.round((100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps)));
  },
};

// All formulas
export const oneRMFormulas = [
  epleyFormula,
  brzyckiFormula,
  lombardiFormula,
  oconnerFormula,
  mayhewFormula,
];

/**
 * Calculate 1RM using a specific formula
 */
export function calculate1RM(
  weight: number,
  reps: number,
  formula: OneRMFormula = epleyFormula,
): number {
  console.log(
    `[1RM] Calculating with ${formula.name} formula: ${weight}lbs x ${reps} reps`,
  );

  if (weight <= 0 || reps <= 0) {
    console.warn('[1RM] Invalid input: weight and reps must be positive');
    return 0;
  }

  const result = formula.calculate(weight, reps);
  console.log(`[1RM] Result: ${result}lbs`);

  return result;
}

/**
 * Calculate average 1RM across all formulas
 */
export function calculateAverage1RM(weight: number, reps: number): number {
  console.log(`[1RM] Calculating average across all formulas`);

  const results = oneRMFormulas.map((formula) =>
    formula.calculate(weight, reps),
  );
  const average = Math.round(
    results.reduce((sum, val) => sum + val, 0) / results.length,
  );

  console.log(`[1RM] Average: ${average}lbs (from ${results.join(', ')})`);

  return average;
}

/**
 * Calculate percentage of 1RM
 */
export function calculatePercentage1RM(
  oneRM: number,
  percentage: number,
): number {
  return Math.round(oneRM * (percentage / 100));
}

/**
 * Estimate reps at a given percentage of 1RM
 * Using inverse Epley formula
 */
export function estimateRepsAt1RMPercentage(percentage: number): number {
  if (percentage >= 100) return 1;
  if (percentage <= 0) return 0;

  // Inverse Epley: r = 30 × ((1RM / w) - 1)
  // Where w = 1RM × (percentage / 100)
  const reps = Math.round(30 * (100 / percentage - 1));

  return Math.max(1, Math.min(30, reps)); // Clamp between 1 and 30
}
