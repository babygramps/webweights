import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  boolean,
  jsonb,
  numeric,
  timestamp,
  interval,
} from 'drizzle-orm/pg-core';

// Mesocycles table
export const mesocycles = pgTable('mesocycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users
  title: text('title').notNull(),
  startDate: date('start_date').notNull(),
  weeks: integer('weeks').notNull(),
});

// NEW: Mesocycle progressions table
export const mesocycleProgressions = pgTable('mesocycle_progressions', {
  id: uuid('id').primaryKey().defaultRandom(),
  mesocycleId: uuid('mesocycle_id')
    .notNull()
    .references(() => mesocycles.id, { onDelete: 'cascade' }),
  progressionType: text('progression_type').notNull(), // 'linear', 'wave', etc.
  baselineWeek: jsonb('baseline_week'), // WeekIntensity
  weeklyProgressions: jsonb('weekly_progressions'), // WeekIntensity[]
  globalSettings: jsonb('global_settings'), // GlobalProgressionSettings
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Workouts table
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  mesocycleId: uuid('mesocycle_id')
    .notNull()
    .references(() => mesocycles.id, { onDelete: 'cascade' }),
  scheduledFor: date('scheduled_for').notNull(),
  label: text('label'),
  weekNumber: integer('week_number'), // NEW: which week of the mesocycle
  intensityModifier: jsonb('intensity_modifier'), // NEW: IntensityParameters for this week
});

// Exercises table
export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type'), // barbell, machine, etc.
  primaryMuscle: text('primary_muscle'),
  tags: jsonb('tags'),
  isPublic: boolean('is_public').default(true),
  ownerId: uuid('owner_id'), // References auth.users
});

// Workout exercises junction table
export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  orderIdx: integer('order_idx'),
  defaults: jsonb('defaults'), // sets, reps, rir/rpe, rest
  weekOverrides: jsonb('week_overrides'), // NEW: exercise-specific progression overrides
  exerciseProgression: jsonb('exercise_progression'), // NEW: ExerciseSpecificProgression
});

// Sets logged table
export const setsLogged = pgTable('sets_logged', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  setNumber: integer('set_number'),
  weight: numeric('weight'),
  reps: integer('reps'),
  rir: integer('rir'),
  rpe: integer('rpe'),
  rest: interval('rest'),
  isMyoRep: boolean('is_myo_rep'),
  isPartial: boolean('is_partial'),
  loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow(),
  plannedWeight: numeric('planned_weight'), // NEW: what was planned vs actual
  plannedReps: integer('planned_reps'), // NEW: what was planned vs actual
  plannedRir: integer('planned_rir'), // NEW: what was planned vs actual
});

// NEW: Progression templates table (pre-built templates)
export const progressionTemplates = pgTable('progression_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // ProgressionType
  weekPattern: jsonb('week_pattern'), // IntensityParameters[]
  targetGoal: text('target_goal'), // 'strength', 'hypertrophy', etc.
  difficulty: text('difficulty'), // 'beginner', 'intermediate', 'advanced'
  duration: integer('duration'), // suggested weeks
  isPublic: boolean('is_public').default(true),
  createdBy: uuid('created_by'), // References auth.users
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
