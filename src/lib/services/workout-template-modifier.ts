import crypto from 'node:crypto';
import { db, workouts, workoutExercises } from '@/db';
import { inArray, sql } from 'drizzle-orm';
import logger from '@/lib/logger';

export interface WorkoutExerciseTemplate {
  exerciseId: string;
  orderIdx: number;
  defaults: Record<string, unknown>;
}

export interface ModificationResult {
  success: boolean;
  affectedWorkouts: number;
  newExercises: number;
}

export class WorkoutTemplateModifier {
  constructor(private readonly database = db) {}

  async addExerciseToWorkouts(
    workoutIds: string[],
    template: WorkoutExerciseTemplate,
  ): Promise<ModificationResult> {
    if (workoutIds.length === 0) {
      return { success: true, affectedWorkouts: 0, newExercises: 0 };
    }

    const newExercises = workoutIds.map((workoutId) => ({
      id: crypto.randomUUID(),
      workoutId,
      exerciseId: template.exerciseId,
      orderIdx: template.orderIdx,
      defaults: template.defaults,
      templateVersion: 1,
      isTemplateDerived: true,
    }));

    await this.database.insert(workoutExercises).values(newExercises);

    await this.database
      .update(workouts)
      .set({ templateVersion: sql`${workouts.templateVersion} + 1` })
      .where(inArray(workouts.id, workoutIds));

    logger.log('[WorkoutTemplateModifier] Added exercise to workouts', {
      workoutIds,
      exerciseId: template.exerciseId,
    });

    return {
      success: true,
      affectedWorkouts: workoutIds.length,
      newExercises: newExercises.length,
    };
  }
}
