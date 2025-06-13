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
  varchar,
} from 'drizzle-orm/pg-core';

// Mesocycles table
export const mesocycles = pgTable('mesocycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users
  title: text('title').notNull(),
  startDate: date('start_date').notNull(),
  weeks: integer('weeks').notNull(),
  isDefault: boolean('is_default').default(false),
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
  templateVersion: integer('template_version').default(1),
  templateId: text('template_id'),
  lastModified: timestamp('last_modified', { withTimezone: true }).defaultNow(),
});

// Exercises table
export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type'), // barbell, machine, etc.
  primaryMuscle: text('primary_muscle'),
  tags: jsonb('tags'),
  equipmentDetail: varchar('equipment_detail', { length: 255 }),
  description: text('description'),
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
  templateVersion: integer('template_version').default(1),
  isTemplateDerived: boolean('is_template_derived').default(true),
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
  myoRepCount: integer('myo_rep_count'),
  partialCount: integer('partial_count'),
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

// AI Coach Sessions table
export const aiCoachSessions = pgTable('ai_coach_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  context: jsonb('context'),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// AI Coach Messages table
export const aiCoachMessages = pgTable('ai_coach_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => aiCoachSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// AI Insights table
export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users
  type: text('type').notNull(), // 'progress', 'recovery', 'form', 'plateau', 'general'
  targetType: text('target_type'), // 'mesocycle', 'workout', 'exercise', 'general'
  targetId: uuid('target_id'),
  insight: jsonb('insight').notNull(),
  score: numeric('score'), // 0-100
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isRead: boolean('is_read').default(false),
});

// AI Coach Actions table
export const aiCoachActions = pgTable('ai_coach_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => aiCoachSessions.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id').notNull(), // References auth.users
  actionType: text('action_type').notNull(),
  params: jsonb('params'),
  status: text('status').notNull(), // 'pending', 'completed', 'failed'
  result: jsonb('result'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Template changes history table
export const templateChanges = pgTable('template_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  mesocycleId: uuid('mesocycle_id').references(() => mesocycles.id, {
    onDelete: 'cascade',
  }),
  changeType: text('change_type').notNull(),
  affectedWorkouts: jsonb('affected_workouts'),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  appliedFromDate: date('applied_from_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by'),
});

// User preferences table
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users
  weightUnit: text('weight_unit'),
  theme: text('theme').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
