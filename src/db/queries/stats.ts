import logger from '@/lib/logger';
import { db } from '../index';
import { setsLogged, workouts, exercises, mesocycles } from '../schema';
import { eq, desc, and, gte, lte, sql, SQL } from 'drizzle-orm';
import { subMonths } from 'date-fns';

// Get recent workouts for a user
export async function getRecentWorkouts(userId: string, limit = 10) {
  logger.log(
    `[stats] Fetching recent workouts for user: ${userId}, limit: ${limit}`,
  );

  try {
    const recentWorkouts = await db
      .select({
        workoutId: workouts.id,
        workoutDate: workouts.scheduledFor,
        workoutLabel: workouts.label,
        weekNumber: workouts.weekNumber,
        intensityModifier: workouts.intensityModifier,
        mesocycleTitle: mesocycles.title,
        setCount: sql<number>`count(${setsLogged.id})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
      })
      .from(workouts)
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .leftJoin(setsLogged, eq(setsLogged.workoutId, workouts.id))
      .where(eq(mesocycles.userId, userId))
      .groupBy(
        workouts.id,
        workouts.scheduledFor,
        workouts.label,
        workouts.weekNumber,
        workouts.intensityModifier,
        mesocycles.title,
      )
      .orderBy(desc(workouts.scheduledFor))
      .limit(limit);

    logger.log(`[stats] Found ${recentWorkouts.length} recent workouts`);
    return recentWorkouts;
  } catch (error) {
    logger.error('[stats] Error fetching recent workouts:', error);
    throw error;
  }
}

// Get personal records for each exercise
export async function getPersonalRecords(userId: string) {
  logger.log(`[stats] Fetching personal records for user: ${userId}`);

  try {
    // 1. Aggregate max weight for each exercise
    const maxWeights = await db
      .select({
        exerciseId: setsLogged.exerciseId,
        maxWeight: sql<number>`MAX(${setsLogged.weight})`,
      })
      .from(setsLogged)
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(eq(mesocycles.userId, userId))
      .groupBy(setsLogged.exerciseId);

    // 2. Aggregate volume and reps per workout for each exercise
    const workoutAggregates = await db
      .select({
        exerciseId: setsLogged.exerciseId,
        workoutId: setsLogged.workoutId,
        volume: sql<number>`SUM(${setsLogged.weight} * ${setsLogged.reps})`,
        totalReps: sql<number>`SUM(${setsLogged.reps})`,
        date: sql<string>`MAX(${setsLogged.loggedAt})`,
      })
      .from(setsLogged)
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(eq(mesocycles.userId, userId))
      .groupBy(setsLogged.exerciseId, setsLogged.workoutId);

    logger.log(`[stats] Found max weights for ${maxWeights.length} exercises`);

    if (maxWeights.length === 0 && workoutAggregates.length === 0) return [];

    const volumeMap = new Map<string, { volume: number; date: Date }>();
    const repsMap = new Map<string, { reps: number; date: Date }>();

    for (const row of workoutAggregates) {
      const existingVol = volumeMap.get(row.exerciseId);
      if (!existingVol || row.volume > existingVol.volume) {
        volumeMap.set(row.exerciseId, {
          volume: row.volume,
          date: new Date(row.date),
        });
      }

      const existingReps = repsMap.get(row.exerciseId);
      if (!existingReps || row.totalReps > existingReps.reps) {
        repsMap.set(row.exerciseId, {
          reps: row.totalReps,
          date: new Date(row.date),
        });
      }
    }

    const exerciseIds = Array.from(
      new Set([
        ...maxWeights.map((m) => m.exerciseId),
        ...workoutAggregates.map((w) => w.exerciseId),
      ]),
    );

    const prs = await Promise.all(
      exerciseIds.map(async (exerciseId) => {
        const weightRecord = maxWeights.find(
          (m) => m.exerciseId === exerciseId,
        );

        let weightSet: {
          exerciseId: string;
          weight: number | null;
          reps: number | null;
          date: Date | null;
          exerciseName: string | null;
        } | null = null;

        if (weightRecord) {
          const [set] = await db
            .select({
              exerciseId: setsLogged.exerciseId,
              weight: sql<number>`${setsLogged.weight}`,
              reps: setsLogged.reps,
              date: setsLogged.loggedAt,
              exerciseName: exercises.name,
            })
            .from(setsLogged)
            .innerJoin(exercises, eq(setsLogged.exerciseId, exercises.id))
            .where(
              and(
                eq(setsLogged.exerciseId, exerciseId),
                eq(
                  sql`CAST(${setsLogged.weight} AS DOUBLE PRECISION)`,
                  Number(weightRecord.maxWeight),
                ),
              ),
            )
            .orderBy(desc(setsLogged.loggedAt))
            .limit(1);

          weightSet = set ?? null;
        }
        const volumeData = volumeMap.get(exerciseId);
        const repsData = repsMap.get(exerciseId);

        return {
          exerciseId,
          exerciseName: weightSet?.exerciseName ?? '',
          maxWeight: weightSet,
          maxVolume: volumeData ?? null,
          maxReps: repsData ?? null,
        };
      }),
    );

    logger.log(`[stats] Found ${prs.length} personal records`);
    return prs;
  } catch (error) {
    logger.error('[stats] Error fetching personal records:', error);
    throw error;
  }
}

// Get volume and intensity data over time
export async function getVolumeProgressData(
  userId: string,
  exerciseId?: string,
  months = 3,
) {
  logger.log(
    `[stats] Fetching volume progress for user: ${userId}, exercise: ${exerciseId || 'all'}, months: ${months}`,
  );

  try {
    const startDate = subMonths(new Date(), months);

    const query = db
      .select({
        date: workouts.scheduledFor,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
        totalSets: sql<number>`count(${setsLogged.id})`,
        avgIntensity: sql<number>`avg(${setsLogged.weight})`,
      })
      .from(setsLogged)
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id));

    const baseConditions = [
      eq(mesocycles.userId, userId),
      gte(workouts.scheduledFor, startDate.toISOString().split('T')[0]),
    ];
    if (exerciseId) {
      baseConditions.push(eq(setsLogged.exerciseId, exerciseId));
    }

    const volumeData = await query
      .where(and(...baseConditions))
      .groupBy(workouts.scheduledFor)
      .orderBy(workouts.scheduledFor);

    logger.log(`[stats] Found ${volumeData.length} volume data points`);
    return volumeData;
  } catch (error) {
    logger.error('[stats] Error fetching volume progress:', error);
    throw error;
  }
}

// Get exercise distribution by muscle group
export async function getMuscleGroupDistribution(userId: string, months = 1) {
  logger.log(
    `[stats] Fetching muscle group distribution for user: ${userId}, months: ${months}`,
  );

  try {
    const startDate = subMonths(new Date(), months);

    const distribution = await db
      .select({
        primaryMuscle: exercises.primaryMuscle,
        setCount: sql<number>`count(${setsLogged.id})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
      })
      .from(setsLogged)
      .innerJoin(exercises, eq(setsLogged.exerciseId, exercises.id))
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(
        and(
          eq(mesocycles.userId, userId),
          gte(workouts.scheduledFor, startDate.toISOString().split('T')[0]),
        ),
      )
      .groupBy(exercises.primaryMuscle);

    logger.log(
      `[stats] Found distribution for ${distribution.length} muscle groups`,
    );
    return distribution;
  } catch (error) {
    logger.error('[stats] Error fetching muscle group distribution:', error);
    throw error;
  }
}

// Get workout completion rate
export async function getWorkoutCompletionRate(
  userId: string,
  mesocycleId?: string,
) {
  logger.log(
    `[stats] Fetching workout completion rate for user: ${userId}, mesocycle: ${mesocycleId || 'all'}`,
  );

  try {
    const query = db
      .select({
        totalWorkouts: sql<number>`count(distinct ${workouts.id})`,
        completedWorkouts: sql<number>`count(distinct case when ${setsLogged.id} is not null then ${workouts.id} end)`,
      })
      .from(workouts)
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .leftJoin(setsLogged, eq(setsLogged.workoutId, workouts.id));

    const baseConditions: SQL<unknown>[] = [eq(mesocycles.userId, userId)];
    if (mesocycleId) {
      baseConditions.push(eq(mesocycles.id, mesocycleId));
    }

    const [completionData] = await query.where(and(...baseConditions));

    const completionRate =
      completionData.totalWorkouts > 0
        ? (completionData.completedWorkouts / completionData.totalWorkouts) *
          100
        : 0;

    logger.log(
      `[stats] Completion rate: ${completionRate.toFixed(1)}% (${completionData.completedWorkouts}/${completionData.totalWorkouts})`,
    );

    return {
      ...completionData,
      completionRate,
    };
  } catch (error) {
    logger.error('[stats] Error fetching completion rate:', error);
    throw error;
  }
}

// Get workout completion rate grouped by week
export async function getWeeklyCompletionData(userId: string, months = 3) {
  logger.log(
    `[stats] Fetching weekly completion for user: ${userId}, months: ${months}`,
  );

  try {
    const startDate = subMonths(new Date(), months).toISOString().split('T')[0];

    const weekExpr = sql<string>`date_trunc('week', ${workouts.scheduledFor})`;

    const data = await db
      .select({
        week: weekExpr,
        totalWorkouts: sql<number>`count(distinct ${workouts.id})`,
        completedWorkouts: sql<number>`count(distinct case when ${setsLogged.id} is not null then ${workouts.id} end)`,
      })
      .from(workouts)
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .leftJoin(setsLogged, eq(setsLogged.workoutId, workouts.id))
      .where(
        and(
          eq(mesocycles.userId, userId),
          gte(workouts.scheduledFor, startDate),
        ),
      )
      .groupBy(weekExpr)
      .orderBy(weekExpr);

    return data.map((d) => ({
      ...d,
      completionRate:
        d.totalWorkouts > 0 ? (d.completedWorkouts / d.totalWorkouts) * 100 : 0,
    }));
  } catch (error) {
    logger.error('[stats] Error fetching weekly completion:', error);
    throw error;
  }
}

// Get exercise progress over time (for specific exercise)
export async function getExerciseProgress(
  userId: string,
  exerciseId: string,
  months = 3,
) {
  logger.log(
    `[stats] Fetching progress for exercise: ${exerciseId}, user: ${userId}, months: ${months}`,
  );

  try {
    const startDate = subMonths(new Date(), months);

    const progress = await db
      .select({
        date: setsLogged.loggedAt,
        weight: setsLogged.weight,
        reps: setsLogged.reps,
        rir: setsLogged.rir,
        rpe: setsLogged.rpe,
        volume: sql<number>`${setsLogged.weight} * ${setsLogged.reps}`,
      })
      .from(setsLogged)
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(
        and(
          eq(mesocycles.userId, userId),
          eq(setsLogged.exerciseId, exerciseId),
          gte(setsLogged.loggedAt, startDate),
        ),
      )
      .orderBy(setsLogged.loggedAt);

    logger.log(`[stats] Found ${progress.length} progress data points`);
    return progress;
  } catch (error) {
    logger.error('[stats] Error fetching exercise progress:', error);
    throw error;
  }
}

// Get all exercises available to a user (public + custom)
export async function getUserExercises(userId: string) {
  logger.log(`[stats] Fetching exercises for user: ${userId}`);

  try {
    // Get all exercises that the user has logged
    const userExercises = await db
      .selectDistinct({
        id: exercises.id,
        name: exercises.name,
        type: exercises.type,
        primaryMuscle: exercises.primaryMuscle,
        isPublic: exercises.isPublic,
      })
      .from(setsLogged)
      .innerJoin(exercises, eq(setsLogged.exerciseId, exercises.id))
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(eq(mesocycles.userId, userId))
      .orderBy(exercises.name);

    logger.log(`[stats] Found ${userExercises.length} exercises used by user`);
    return userExercises;
  } catch (error) {
    logger.error('[stats] Error fetching user exercises:', error);
    throw error;
  }
}

// Get exercise distribution within a given muscle group
export async function getExerciseDistributionByMuscle(
  userId: string,
  muscleGroup: string,
  months = 1,
) {
  logger.log(
    `[stats] Fetching exercise distribution for user: ${userId}, muscle: ${muscleGroup}, months: ${months}`,
  );

  try {
    const startDate = subMonths(new Date(), months);

    const distribution = await db
      .select({
        exerciseName: exercises.name,
        setCount: sql<number>`count(${setsLogged.id})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
      })
      .from(setsLogged)
      .innerJoin(exercises, eq(setsLogged.exerciseId, exercises.id))
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(
        and(
          eq(mesocycles.userId, userId),
          eq(exercises.primaryMuscle, muscleGroup),
          gte(workouts.scheduledFor, startDate.toISOString().split('T')[0]),
        ),
      )
      .groupBy(exercises.name);

    logger.log(
      `[stats] Found distribution for ${distribution.length} exercises in muscle group ${muscleGroup}`,
    );
    return distribution;
  } catch (error) {
    logger.error('[stats] Error fetching exercise distribution:', error);
    throw error;
  }
}

// Get muscle group distribution between explicit dates (inclusive)
export async function getMuscleGroupDistributionBetweenDates(
  userId: string,
  from: string,
  to: string,
) {
  logger.log(
    `[stats] Fetching muscle group distribution for user: ${userId}, range: ${from} -> ${to}`,
  );

  try {
    const distribution = await db
      .select({
        primaryMuscle: exercises.primaryMuscle,
        setCount: sql<number>`count(${setsLogged.id})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
      })
      .from(setsLogged)
      .innerJoin(exercises, eq(setsLogged.exerciseId, exercises.id))
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(
        and(
          eq(mesocycles.userId, userId),
          gte(workouts.scheduledFor, from),
          lte(workouts.scheduledFor, to),
        ),
      )
      .groupBy(exercises.primaryMuscle);

    return distribution;
  } catch (error) {
    logger.error(
      '[stats] Error fetching muscle group distribution (range):',
      error,
    );
    throw error;
  }
}

// Get exercise distribution by muscle group between explicit dates
export async function getExerciseDistributionByMuscleBetweenDates(
  userId: string,
  muscleGroup: string,
  from: string,
  to: string,
) {
  logger.log(
    `[stats] Fetching exercise distribution for user: ${userId}, muscle: ${muscleGroup}, range: ${from} -> ${to}`,
  );

  try {
    const distribution = await db
      .select({
        exerciseName: exercises.name,
        setCount: sql<number>`count(${setsLogged.id})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
      })
      .from(setsLogged)
      .innerJoin(exercises, eq(setsLogged.exerciseId, exercises.id))
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(
        and(
          eq(mesocycles.userId, userId),
          eq(exercises.primaryMuscle, muscleGroup),
          gte(workouts.scheduledFor, from),
          lte(workouts.scheduledFor, to),
        ),
      )
      .groupBy(exercises.name);

    return distribution;
  } catch (error) {
    logger.error(
      '[stats] Error fetching exercise distribution (range):',
      error,
    );
    throw error;
  }
}
