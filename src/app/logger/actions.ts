'use server';

import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { getWorkoutsInRange } from '@/db/queries/workouts';
import { startOfWeek, endOfWeek } from 'date-fns';
import { redirect } from 'next/navigation';
import { db } from '@/db/index';
import { mesocycles } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function getWorkoutsForCurrentWeek() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });

  // Determine which mesocycle to pull workouts from (default if available)
  let mesocycleId: string | undefined;

  try {
    const [defaultMeso] = await db
      .select({ id: mesocycles.id })
      .from(mesocycles)
      .where(
        and(eq(mesocycles.userId, user.id), eq(mesocycles.isDefault, true)),
      )
      .limit(1);

    if (defaultMeso) {
      mesocycleId = defaultMeso.id;
    } else {
      // fallback to most recent program
      [mesocycleId] = (
        await db
          .select({ id: mesocycles.id })
          .from(mesocycles)
          .where(eq(mesocycles.userId, user.id))
          .orderBy(desc(mesocycles.startDate))
          .limit(1)
      ).map((r) => r.id);
    }
  } catch {
    // If lookup fails, fall back to showing all workouts
  }

  return getWorkoutsInRange(user.id, start, end, mesocycleId);
}

export async function createFreestyleWorkout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if a freestyle mesocycle exists
  const { data: existing, error: fetchError } = await supabase
    .from('mesocycles')
    .select('id')
    .eq('user_id', user.id)
    .eq('title', 'Freestyle')
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  let mesocycleId = existing?.id;

  if (!mesocycleId) {
    const { data: newMesocycle, error: createError } = await supabase
      .from('mesocycles')
      .insert({
        user_id: user.id,
        title: 'Freestyle',
        weeks: 1,
        start_date: format(new Date(), 'yyyy-MM-dd'),
      })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    mesocycleId = newMesocycle.id;
  }

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      mesocycle_id: mesocycleId,
      label: 'Freestyle Workout',
      scheduled_for: format(new Date(), 'yyyy-MM-dd'),
    })
    .select('id')
    .single();

  if (workoutError) {
    throw workoutError;
  }

  redirect(`/logger/${workout.id}`);
}
