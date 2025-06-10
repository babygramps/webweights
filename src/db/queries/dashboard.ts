import { db } from '../index';
import { mesocycles, workouts } from '../schema';
import {
  getRecentWorkouts,
  getWorkoutCompletionRate,
  getPersonalRecords,
} from './stats';
import { eq, desc, and, gte } from 'drizzle-orm';
import { differenceInDays, startOfDay } from 'date-fns';
import { parseLocalDate } from '@/lib/utils/date';

export interface DashboardOverview {
  currentWeek: number | null;
  totalWorkouts: number;
  nextWorkout?: {
    id: string;
    label: string;
  };
  personalRecords: number;
  recentWorkouts: Awaited<ReturnType<typeof getRecentWorkouts>>;
}

export async function getDashboardOverview(
  userId: string,
): Promise<DashboardOverview> {
  // Try to fetch the user's default mesocycle first
  let [mesocycle] = await db
    .select({
      id: mesocycles.id,
      startDate: mesocycles.startDate,
      weeks: mesocycles.weeks,
    })
    .from(mesocycles)
    .where(and(eq(mesocycles.userId, userId), eq(mesocycles.isDefault, true)))
    .limit(1);

  // Fallback: newest program if no default set yet
  if (!mesocycle) {
    [mesocycle] = await db
      .select({
        id: mesocycles.id,
        startDate: mesocycles.startDate,
        weeks: mesocycles.weeks,
      })
      .from(mesocycles)
      .where(eq(mesocycles.userId, userId))
      .orderBy(desc(mesocycles.startDate))
      .limit(1);
  }

  let currentWeek: number | null = null;
  let nextWorkoutInfo: { id: string; label: string } | undefined;

  if (mesocycle) {
    const startDate = parseLocalDate(String(mesocycle.startDate));
    const daysElapsed = differenceInDays(startOfDay(new Date()), startDate);
    currentWeek = Math.floor(daysElapsed / 7) + 1;

    const today = startOfDay(new Date()).toISOString().split('T')[0];
    const [nextWorkout] = await db
      .select({ id: workouts.id, label: workouts.label })
      .from(workouts)
      .where(
        and(
          eq(workouts.mesocycleId, mesocycle.id),
          gte(workouts.scheduledFor, today),
        ),
      )
      .orderBy(workouts.scheduledFor)
      .limit(1);

    if (nextWorkout) {
      nextWorkoutInfo = {
        id: nextWorkout.id,
        label: nextWorkout.label ?? 'Workout',
      };
    }
  }

  const [recentWorkouts, completion, personalRecords] = await Promise.all([
    getRecentWorkouts(userId, 3),
    getWorkoutCompletionRate(userId, mesocycle?.id),
    getPersonalRecords(userId),
  ]);

  return {
    currentWeek,
    totalWorkouts: completion.totalWorkouts,
    nextWorkout: nextWorkoutInfo,
    personalRecords: personalRecords.length,
    recentWorkouts,
  };
}
