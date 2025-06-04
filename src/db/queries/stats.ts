import { db } from '../index';
import { setsLogged, workouts, exercises, mesocycles } from '../schema';
import { eq, desc, and, gte, sql, SQL } from 'drizzle-orm';
import { subMonths } from 'date-fns';

// Get recent workouts for a user
export async function getRecentWorkouts(userId: string, limit = 10) {
  console.log(
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

    console.log(`[stats] Found ${recentWorkouts.length} recent workouts`);
    return recentWorkouts;
  } catch (error) {
    console.error('[stats] Error fetching recent workouts:', error);
    throw error;
  }
}

// Get personal records for each exercise
export async function getPersonalRecords(userId: string) {
  console.log(`[stats] Fetching personal records for user: ${userId}`);

  try {
    // 1. Aggregate max stats per exercise
    const maxStats = await db
      .select({
        exerciseId: setsLogged.exerciseId,
        maxWeight: sql<number>`MAX(${setsLogged.weight})`,
        maxVolume: sql<number>`MAX(${setsLogged.weight} * ${setsLogged.reps})`,
        maxReps: sql<number>`MAX(${setsLogged.reps})`,
      })
      .from(setsLogged)
      .innerJoin(workouts, eq(setsLogged.workoutId, workouts.id))
      .innerJoin(mesocycles, eq(workouts.mesocycleId, mesocycles.id))
      .where(eq(mesocycles.userId, userId))
      .groupBy(setsLogged.exerciseId);

    console.log(`[stats] Found stats for ${maxStats.length} exercises`);

    if (maxStats.length === 0) return [];

    // 2. For each exercise, get sets corresponding to each record
    const prs = await Promise.all(
      maxStats.map(
        async (record: {
          exerciseId: string;
          maxWeight: number;
          maxVolume: number;
          maxReps: number;
        }) => {
          const { exerciseId, maxWeight, maxVolume, maxReps } = record;

          const baseQuery = db
            .select({
              exerciseId: setsLogged.exerciseId,
              weight: setsLogged.weight,
              reps: setsLogged.reps,
              date: setsLogged.loggedAt,
              exerciseName: exercises.name,
            })
            .from(setsLogged)
            .innerJoin(exercises, eq(setsLogged.exerciseId, exercises.id));

          const [weightSet] = await baseQuery
            .where(
              and(
                eq(setsLogged.exerciseId, exerciseId),
                eq(
                  sql`CAST(${setsLogged.weight} AS DOUBLE PRECISION)`,
                  Number(maxWeight),
                ),
              ),
            )
            .orderBy(desc(setsLogged.loggedAt))
            .limit(1);

          const [volumeSet] = await baseQuery
            .where(
              and(
                eq(setsLogged.exerciseId, exerciseId),
                eq(
                  sql`CAST(${setsLogged.weight} * ${setsLogged.reps} AS DOUBLE PRECISION)`,
                  Number(maxVolume),
                ),
              ),
            )
            .orderBy(desc(setsLogged.loggedAt))
            .limit(1);

          const [repsSet] = await baseQuery
            .where(
              and(
                eq(setsLogged.exerciseId, exerciseId),
                eq(setsLogged.reps, maxReps),
              ),
            )
            .orderBy(desc(setsLogged.loggedAt))
            .limit(1);

          return {
            exerciseId,
            exerciseName:
              weightSet?.exerciseName ??
              volumeSet?.exerciseName ??
              repsSet?.exerciseName ??
              '',
            maxWeight: weightSet,
            maxVolume: volumeSet,
            maxReps: repsSet,
          };
        },
      ),
    );

    console.log(`[stats] Found ${prs.length} personal records`);
    return prs;
  } catch (error) {
    console.error('[stats] Error fetching personal records:', error);
    throw error;
  }
}

// Get volume and intensity data over time
export async function getVolumeProgressData(
  userId: string,
  exerciseId?: string,
  months = 3,
) {
  console.log(
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

    console.log(`[stats] Found ${volumeData.length} volume data points`);
    return volumeData;
  } catch (error) {
    console.error('[stats] Error fetching volume progress:', error);
    throw error;
  }
}

// Get exercise distribution by muscle group
export async function getMuscleGroupDistribution(userId: string, months = 1) {
  console.log(
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

    console.log(
      `[stats] Found distribution for ${distribution.length} muscle groups`,
    );
    return distribution;
  } catch (error) {
    console.error('[stats] Error fetching muscle group distribution:', error);
    throw error;
  }
}

// Get workout completion rate
export async function getWorkoutCompletionRate(
  userId: string,
  mesocycleId?: string,
) {
  console.log(
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

    console.log(
      `[stats] Completion rate: ${completionRate.toFixed(1)}% (${completionData.completedWorkouts}/${completionData.totalWorkouts})`,
    );

    return {
      ...completionData,
      completionRate,
    };
  } catch (error) {
    console.error('[stats] Error fetching completion rate:', error);
    throw error;
  }
}

// Get exercise progress over time (for specific exercise)
export async function getExerciseProgress(
  userId: string,
  exerciseId: string,
  months = 3,
) {
  console.log(
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

    console.log(`[stats] Found ${progress.length} progress data points`);
    return progress;
  } catch (error) {
    console.error('[stats] Error fetching exercise progress:', error);
    throw error;
  }
}

// Get all exercises available to a user (public + custom)
export async function getUserExercises(userId: string) {
  console.log(`[stats] Fetching exercises for user: ${userId}`);

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

    console.log(`[stats] Found ${userExercises.length} exercises used by user`);
    return userExercises;
  } catch (error) {
    console.error('[stats] Error fetching user exercises:', error);
    throw error;
  }
}
