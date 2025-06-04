import { db } from '../index';
import { workouts, setsLogged, exercises, mesocycles } from '../schema';
import { eq, sql } from 'drizzle-orm';

export interface WorkoutSetExport {
  workoutDate: string | null;
  workoutLabel: string | null;
  weekNumber: number | null;
  intensityVolume: number | null;
  intensityWeight: number | null;
  intensityRir: number | null;
  intensityRpe: number | null;
  intensitySets: number | null;
  intensityRepsModifier: number | null;
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
      intensityVolume: sql<number>`(${workouts.intensityModifier} ->> 'volume')::double precision`,
      intensityWeight: sql<number>`(${workouts.intensityModifier} ->> 'weight')::double precision`,
      intensityRir: sql<number>`(${workouts.intensityModifier} ->> 'rir')::double precision`,
      intensityRpe: sql<number>`(${workouts.intensityModifier} ->> 'rpe')::double precision`,
      intensitySets: sql<number>`(${workouts.intensityModifier} ->> 'sets')::double precision`,
      intensityRepsModifier: sql<number>`(${workouts.intensityModifier} ->> 'repsModifier')::double precision`,
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
