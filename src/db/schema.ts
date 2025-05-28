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

// Workouts table
export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  mesocycleId: uuid('mesocycle_id')
    .notNull()
    .references(() => mesocycles.id, { onDelete: 'cascade' }),
  scheduledFor: date('scheduled_for').notNull(),
  label: text('label'),
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
});
