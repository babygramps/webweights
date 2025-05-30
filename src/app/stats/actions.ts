'use server';

import { createClient } from '@/lib/supabase/server';
import { getExerciseProgress } from '@/db/queries/stats';

export async function fetchExerciseProgress(exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const progressData = await getExerciseProgress(user.id, exerciseId, 6);
  return progressData.map((d) => ({
    date: d.date || new Date(),
    weight: Number(d.weight) || 0,
    reps: Number(d.reps) || 0,
    rir: d.rir ? Number(d.rir) : undefined,
    rpe: d.rpe ? Number(d.rpe) : undefined,
    volume: Number(d.volume) || 0,
  }));
}
