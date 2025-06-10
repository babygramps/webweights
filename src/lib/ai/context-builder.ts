import { db } from '@/db';
import {
  mesocycles,
  workouts,
  setsLogged,
  exercises,
  mesocycleProgressions,
} from '@/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { subDays } from 'date-fns';
import type { UserContext, CoachContext } from '@/types/ai-coach';

export class ContextBuilder {
  async buildSystemPrompt(context: CoachContext): Promise<string> {
    const basePrompt = `You are an expert AI weightlifting coach with deep knowledge of strength training, periodization, and exercise science. You help users optimize their training through personalized advice and data-driven insights.

Current context:
- Page: ${context.currentPage}
- Mode: ${context.mode}`;

    const modeSpecificPrompts = {
      chat: 'Engage in helpful conversation about training, form, recovery, and programming.',
      'quick-action': 'Suggest immediate, actionable steps the user can take.',
      'guided-flow': 'Guide the user through a step-by-step process.',
      analysis: 'Provide detailed analysis with visualizations and insights.',
    };

    return `${basePrompt}
${modeSpecificPrompts[context.mode]}

Guidelines:
- Be encouraging and supportive
- Base recommendations on scientific principles
- Consider user's experience level and goals
- Prioritize safety and proper form
- Use data to support recommendations`;
  }

  async buildUserContext(userId: string): Promise<UserContext> {
    const [profile, recentWorkouts, activeMesocycle, exerciseHistory] =
      await Promise.all([
        this.getUserProfile(userId),
        this.getRecentWorkouts(userId, 30),
        this.getActiveMesocycle(userId),
        this.getExerciseHistory(userId),
      ]);

    return {
      profile,
      recentWorkouts: this.summarizeWorkouts(recentWorkouts),
      mesocycle: activeMesocycle
        ? this.summarizeMesocycle(activeMesocycle)
        : null,
      strengths: this.analyzeStrengths(exerciseHistory),
      weaknesses: this.analyzeWeaknesses(exerciseHistory),
    };
  }

  private async getUserProfile(userId: string) {
    // For now, return a basic profile. In production, this would fetch from a user profile table
    return {
      id: userId,
      experience: 'intermediate',
      goals: ['strength', 'muscle'],
      injuries: [],
    };
  }

  private async getRecentWorkouts(userId: string, days: number) {
    const startDate = subDays(new Date(), days).toISOString().split('T')[0];

    const recentWorkouts = await db
      .select({
        id: workouts.id,
        scheduledFor: workouts.scheduledFor,
        label: workouts.label,
        weekNumber: workouts.weekNumber,
        mesocycleId: workouts.mesocycleId,
        setCount: sql<number>`count(${setsLogged.id})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
      })
      .from(workouts)
      .leftJoin(setsLogged, eq(setsLogged.workoutId, workouts.id))
      .leftJoin(mesocycles, eq(mesocycles.id, workouts.mesocycleId))
      .where(
        and(
          eq(mesocycles.userId, userId),
          gte(workouts.scheduledFor, startDate),
        ),
      )
      .groupBy(workouts.id)
      .orderBy(desc(workouts.scheduledFor));

    return recentWorkouts;
  }

  private async getActiveMesocycle(userId: string) {
    const activeMesocycle = await db
      .select({
        id: mesocycles.id,
        title: mesocycles.title,
        startDate: mesocycles.startDate,
        weeks: mesocycles.weeks,
        progression: mesocycleProgressions.progressionType,
      })
      .from(mesocycles)
      .leftJoin(
        mesocycleProgressions,
        eq(mesocycleProgressions.mesocycleId, mesocycles.id),
      )
      .where(eq(mesocycles.userId, userId))
      .orderBy(desc(mesocycles.startDate))
      .limit(1);

    if (activeMesocycle.length === 0) return null;

    const workoutCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(workouts)
      .where(eq(workouts.mesocycleId, activeMesocycle[0].id));

    return { ...activeMesocycle[0], workoutCount: workoutCount[0].count };
  }

  private async getExerciseHistory(userId: string) {
    const exerciseStats = await db
      .select({
        exerciseId: exercises.id,
        exerciseName: exercises.name,
        primaryMuscle: exercises.primaryMuscle,
        setCount: sql<number>`count(${setsLogged.id})`,
        maxWeight: sql<number>`max(${setsLogged.weight})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
        avgReps: sql<number>`avg(${setsLogged.reps})`,
      })
      .from(setsLogged)
      .innerJoin(exercises, eq(exercises.id, setsLogged.exerciseId))
      .innerJoin(workouts, eq(workouts.id, setsLogged.workoutId))
      .innerJoin(mesocycles, eq(mesocycles.id, workouts.mesocycleId))
      .where(eq(mesocycles.userId, userId))
      .groupBy(exercises.id, exercises.name, exercises.primaryMuscle);

    return exerciseStats;
  }

  async getMesocycleData(mesocycleId: string) {
    const [mesocycleInfo, workoutData, progressionData] = await Promise.all([
      db
        .select()
        .from(mesocycles)
        .where(eq(mesocycles.id, mesocycleId))
        .limit(1),
      this.getMesocycleWorkouts(mesocycleId),
      db
        .select()
        .from(mesocycleProgressions)
        .where(eq(mesocycleProgressions.mesocycleId, mesocycleId))
        .limit(1),
    ]);

    return {
      mesocycle: mesocycleInfo[0],
      workouts: workoutData,
      progression: progressionData[0],
    };
  }

  private async getMesocycleWorkouts(mesocycleId: string) {
    return db
      .select({
        id: workouts.id,
        scheduledFor: workouts.scheduledFor,
        weekNumber: workouts.weekNumber,
        setCount: sql<number>`count(distinct ${setsLogged.id})`,
        exerciseCount: sql<number>`count(distinct ${setsLogged.exerciseId})`,
        totalVolume: sql<number>`sum(${setsLogged.weight} * ${setsLogged.reps})`,
      })
      .from(workouts)
      .leftJoin(setsLogged, eq(setsLogged.workoutId, workouts.id))
      .where(eq(workouts.mesocycleId, mesocycleId))
      .groupBy(workouts.id)
      .orderBy(workouts.scheduledFor);
  }

  async getExerciseDatabase() {
    const allExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        type: exercises.type,
        primaryMuscle: exercises.primaryMuscle,
        tags: exercises.tags,
      })
      .from(exercises)
      .where(eq(exercises.isPublic, true));

    return allExercises;
  }

  private summarizeWorkouts(
    workouts: Array<{
      id: string;
      scheduledFor: string;
      label: string | null;
      weekNumber: number | null;
      mesocycleId: string;
      setCount: number;
      totalVolume: number;
    }>,
  ) {
    const muscleGroupFrequency: Record<string, number> = {};
    let totalVolume = 0;
    let totalDuration = 0;

    workouts.forEach((workout) => {
      totalVolume += workout.totalVolume || 0;
      // Duration would be calculated from actual workout logs
      totalDuration += 60; // Placeholder: 60 minutes average
    });

    return {
      count: workouts.length,
      avgDuration: workouts.length > 0 ? totalDuration / workouts.length : 0,
      muscleGroupFrequency,
      totalVolume,
    };
  }

  private summarizeMesocycle(mesocycle: {
    id: string;
    title: string;
    startDate: string;
    weeks: number;
    workoutCount: number;
  }) {
    const startDate = new Date(mesocycle.startDate);
    const currentDate = new Date();
    const weeksPassed = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );
    const currentWeek = Math.min(weeksPassed + 1, mesocycle.weeks);
    const progress = (currentWeek / mesocycle.weeks) * 100;

    return {
      id: mesocycle.id,
      name: mesocycle.title,
      week: currentWeek,
      progress,
      adherence: 85, // Placeholder - would calculate from actual vs planned workouts
    };
  }

  private analyzeStrengths(
    exerciseHistory: Array<{
      exerciseId: string;
      exerciseName: string;
      primaryMuscle: string | null;
      setCount: number;
      maxWeight: number;
      totalVolume: number;
      avgReps: number;
    }>,
  ) {
    // Analyze which muscle groups or exercises show the most progress
    const strengths: string[] = [];

    // Sort by total volume to find most trained areas
    const sortedByVolume = [...exerciseHistory].sort(
      (a, b) => b.totalVolume - a.totalVolume,
    );

    if (sortedByVolume.length > 0) {
      const topMuscles = new Set<string>();
      sortedByVolume.slice(0, 3).forEach((ex) => {
        if (ex.primaryMuscle) {
          topMuscles.add(ex.primaryMuscle);
        }
      });
      strengths.push(...Array.from(topMuscles));
    }

    return strengths;
  }

  private analyzeWeaknesses(
    exerciseHistory: Array<{
      exerciseId: string;
      exerciseName: string;
      primaryMuscle: string | null;
      setCount: number;
      maxWeight: number;
      totalVolume: number;
      avgReps: number;
    }>,
  ) {
    // Identify undertrained areas or muscle groups
    const allMuscleGroups = [
      'chest',
      'back',
      'shoulders',
      'legs',
      'arms',
      'core',
    ];
    const trainedMuscles = new Set(
      exerciseHistory
        .filter((ex) => ex.primaryMuscle)
        .map((ex) => ex.primaryMuscle.toLowerCase()),
    );

    const weaknesses = allMuscleGroups.filter(
      (muscle) => !trainedMuscles.has(muscle),
    );

    return weaknesses;
  }
}
