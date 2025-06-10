import { db } from '../index';
import { workouts, mesocycles } from '../schema';
import { eq, gte, lte, and } from 'drizzle-orm';

export async function getWorkoutsInRange(
  userId: string,
  start: Date,
  end: Date,
  mesocycleId?: string,
) {
  const startDate = start.toISOString().split('T')[0];
  const endDate = end.toISOString().split('T')[0];

  const conditions = [
    eq(mesocycles.userId, userId),
    gte(workouts.scheduledFor, startDate),
    lte(workouts.scheduledFor, endDate),
  ];

  if (mesocycleId) {
    conditions.push(eq(mesocycles.id, mesocycleId));
  }

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
    .where(and(...conditions))
    .orderBy(workouts.scheduledFor);
}
