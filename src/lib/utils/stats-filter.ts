import { startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { PersonalRecord, UserExercise } from '@/lib/types/stats';

export function isDateInRange(date: Date | string, range?: DateRange): boolean {
  if (!range) return true;
  const parsed = new Date(date);
  if (range.from && parsed < startOfDay(range.from)) return false;
  if (range.to && parsed > endOfDay(range.to)) return false;
  return true;
}

export interface PersonalRecordFilterOpts {
  range?: DateRange;
  exerciseId?: string;
  muscle?: string;
  userExercises: UserExercise[];
}

export function filterPersonalRecords(
  records: PersonalRecord[],
  { range, exerciseId, muscle, userExercises }: PersonalRecordFilterOpts,
): PersonalRecord[] {
  let prs = records;
  if (exerciseId) {
    prs = prs.filter((pr) => pr.exerciseId === exerciseId);
  }
  if (muscle) {
    const ids = userExercises
      .filter((ex) => ex.primaryMuscle === muscle)
      .map((ex) => ex.id);
    prs = prs.filter((pr) => ids.includes(pr.exerciseId));
  }
  if (range) {
    prs = prs.filter((pr) => {
      const dates = [
        pr.maxWeight?.date,
        pr.maxVolume?.date,
        pr.maxReps?.date,
      ].filter(Boolean);
      return dates.some((d) => isDateInRange(d as string | Date, range));
    });
  }
  return prs;
}
