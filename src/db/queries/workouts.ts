import { db } from '../index';
import { workouts, mesocycles } from '../schema';
import { eq, gte, lte, and } from 'drizzle-orm';

export async function getWorkoutsInRange(
  userId: string,
  start: Date,
  end: Date,
) {
  const startDate = start.toISOString().split('T')[0];
  const endDate = end.toISOString().split('T')[0];

  return db
    .select({
      id: workouts.id,
      scheduledFor: workouts.scheduledFor,
      label: workouts.label,
      weekNumber: workouts.weekNumber,
      intensityModifier: workouts.intensityModifier,
    })
    .from(workouts)
    .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
    .where(
      and(
        eq(mesocycles.userId, userId),
        gte(workouts.scheduledFor, startDate),
        lte(workouts.scheduledFor, endDate),
      ),
    )
    .orderBy(workouts.scheduledFor);
}

export async function getUpcomingWorkouts(userId: string, limit = 50) {
  const today = new Date().toISOString().split('T')[0];

  return db
    .select({
      id: workouts.id,
      scheduledFor: workouts.scheduledFor,
      label: workouts.label,
      weekNumber: workouts.weekNumber,
      intensityModifier: workouts.intensityModifier,
    })
    .from(workouts)
    .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
    .where(
      and(eq(mesocycles.userId, userId), gte(workouts.scheduledFor, today)),
    )
    .orderBy(workouts.scheduledFor)
    .limit(limit);
}
