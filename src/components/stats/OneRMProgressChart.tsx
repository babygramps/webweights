'use client';

import { useMemo } from 'react';
import { ProgressChart } from './ProgressChart';
import type { OneRMFormula } from '@/lib/utils/1rm-calculator';
import { calculateAverage1RM, calculate1RM } from '@/lib/utils/1rm-calculator';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { format } from 'date-fns';

interface SetData {
  date: string | Date;
  weight: number;
  reps: number;
}

interface OneRMProgressChartProps {
  exerciseName: string;
  sets: SetData[];
  formula?: OneRMFormula;
}

export function OneRMProgressChart({
  exerciseName,
  sets,
  formula,
}: OneRMProgressChartProps) {
  const { weightUnit, convertWeight } = useUserPreferences();

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    sets.forEach((set) => {
      const date =
        typeof set.date === 'string'
          ? set.date.split('T')[0]
          : format(set.date, 'yyyy-MM-dd');
      const oneRm = formula
        ? calculate1RM(set.weight, set.reps, formula)
        : calculateAverage1RM(set.weight, set.reps);
      const current = map.get(date);
      if (!current || oneRm > current) {
        map.set(date, oneRm);
      }
    });
    return Array.from(map.entries())
      .map(([date, oneRm]) => ({ date, oneRm: convertWeight(oneRm) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sets, formula, convertWeight]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{exerciseName} 1RM Progress</CardTitle>
          <CardDescription>Not enough data to display</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <ProgressChart
      title={`${exerciseName} 1RM Progress`}
      description="Estimated one-rep max over time"
      data={chartData}
      dataKey="oneRm"
      xAxisKey="date"
      yAxisLabel={`1RM (${weightUnit})`}
      chartType="line"
      color="#ef4444"
    />
  );
}
