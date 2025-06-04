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
  nextWorkout?: string;
  personalRecords: number;
  recentWorkouts: Awaited<ReturnType<typeof getRecentWorkouts>>;
}

export async function getDashboardOverview(
  userId: string,
): Promise<DashboardOverview> {
  const [mesocycle] = await db
    .select({
      id: mesocycles.id,
      startDate: mesocycles.startDate,
      weeks: mesocycles.weeks,
    })
    .from(mesocycles)
    .where(eq(mesocycles.userId, userId))
    .orderBy(desc(mesocycles.startDate))
    .limit(1);

  let currentWeek: number | null = null;
  let nextWorkoutLabel: string | undefined;

  if (mesocycle) {
    const startDate = parseLocalDate(String(mesocycle.startDate));
    const daysElapsed = differenceInDays(startOfDay(new Date()), startDate);
    currentWeek = Math.floor(daysElapsed / 7) + 1;

    const today = startOfDay(new Date()).toISOString().split('T')[0];
    const [nextWorkout] = await db
      .select({ label: workouts.label })
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
      nextWorkoutLabel = nextWorkout.label ?? undefined;
    }
  }

  const [recentWorkouts, completion, personalRecords] = await Promise.all([
    getRecentWorkouts(userId, 3),
    getWorkoutCompletionRate(userId),
    getPersonalRecords(userId),
  ]);

  return {
    currentWeek,
    totalWorkouts: completion.totalWorkouts,
    nextWorkout: nextWorkoutLabel,
    personalRecords: personalRecords.length,
    recentWorkouts,
  };
}
