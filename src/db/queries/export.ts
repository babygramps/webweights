import { db } from '../index';
import { workouts, setsLogged, exercises, mesocycles } from '../schema';
import { eq, sql } from 'drizzle-orm';

export interface WorkoutSetExport {
  workoutDate: string | null;
  workoutLabel: string | null;
  weekNumber: number | null;
  intensityModifier: unknown | null;
  exerciseName: string | null;
  setNumber: number | null;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  rpe: number | null;
  loggedAt: Date | null;
}

export async function getUserWorkoutData(
  userId: string,
): Promise<WorkoutSetExport[]> {
  return db
    .select({
      workoutDate: workouts.scheduledFor,
      workoutLabel: workouts.label,
      weekNumber: workouts.weekNumber,
      intensityModifier: workouts.intensityModifier,
      exerciseName: exercises.name,
      setNumber: setsLogged.setNumber,
      weight: sql<number>`${setsLogged.weight}`,
      reps: sql<number>`${setsLogged.reps}`,
      rir: setsLogged.rir,
      rpe: setsLogged.rpe,
      loggedAt: setsLogged.loggedAt,
    })
    .from(workouts)
    .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
    .leftJoin(setsLogged, eq(setsLogged.workoutId, workouts.id))
    .leftJoin(exercises, eq(setsLogged.exerciseId, exercises.id))
    .where(eq(mesocycles.userId, userId))
    .orderBy(workouts.scheduledFor, setsLogged.setNumber);
}
