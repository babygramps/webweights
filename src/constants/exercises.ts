export const EQUIPMENT_TYPES = ['barbell', 'dumbbell', 'machine', 'bodyweight'];

// Standard barbell and bar weights in kg
export const BARBELL_WEIGHTS = {
  'Olympic Barbell': 20, // 45 lbs
  'Standard Barbell': 15.9, // 35 lbs
  'EZ Curl Bar': 8.2, // 18 lbs (typical weight)
} as const;

// Conversion to display weights based on unit preference
export const BARBELL_WEIGHTS_LBS = {
  'Olympic Barbell': 45,
  'Standard Barbell': 35,
  'EZ Curl Bar': 18,
} as const;

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'traps',
];
export const COMMON_TAGS = [
  'compound',
  'isolation',
  'push',
  'pull',
  'legs',
  'arms',
  'unilateral',
];
