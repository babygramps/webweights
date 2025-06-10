'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MuscleGroupData {
  primaryMuscle: string;
  setCount: number;
  totalVolume: number;
  percentage?: string;
  name?: string;
  value?: number;
}

interface MuscleGroupChartProps {
  data: MuscleGroupData[];
  title?: string;
  description?: string;
  dataKey?: 'setCount' | 'totalVolume';
  months?: number;
}

const COLORS = [
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
];

const CustomTooltip = ({
  active,
  payload,
}: import('recharts').TooltipProps<string, string>) => {
  const { weightUnit, convertWeight } = useUserPreferences();

  if (active && payload && payload.length) {
    const entry = payload[0] as unknown as {
      name: string;
      value: number;
      payload: MuscleGroupData;
    };
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{entry.name}</p>
        <p className="text-sm text-primary">
          {entry.name === 'setCount' || entry.payload.name === 'setCount'
            ? `${entry.value} sets`
            : `${convertWeight(entry.value).toFixed(0)} ${weightUnit}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.payload.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = (entry: MuscleGroupData) => {
  return `${entry.percentage}%`;
};

export function MuscleGroupChart({
  data,
  title = 'Muscle Group Distribution',
  description = 'Training volume by muscle group',
  dataKey = 'setCount',
  months = 1,
}: MuscleGroupChartProps) {
  const { convertWeight } = useUserPreferences();

  const [drilldown, setDrilldown] = useState<{
    muscle: string;
    data: MuscleGroupData[];
  } | null>(null);
  const [loadingDrill, setLoadingDrill] = useState(false);

  const handleSliceClick = async (entry: MuscleGroupData) => {
    if (drilldown || loadingDrill) return; // Prevent nested clicks
    const muscle = entry.primaryMuscle || 'Unknown';
    try {
      setLoadingDrill(true);
      const res = await fetch(
        `/api/stats/exercise-distribution?muscleGroup=${encodeURIComponent(
          muscle,
        )}&months=${months}`,
      );
      const json = await res.json();
      const dist = (json.data || []) as Array<{
        exerciseName: string;
        setCount: number;
        totalVolume: number;
      }>;

      const transformed: MuscleGroupData[] = dist.map((d) => ({
        primaryMuscle: muscle,
        name: d.exerciseName,
        setCount: d.setCount,
        totalVolume: d.totalVolume,
      }));

      setDrilldown({ muscle, data: transformed });
    } finally {
      setLoadingDrill(false);
    }
  };

  const baseData = drilldown ? drilldown.data : data;

  // Filter out invalid data and calculate percentages
  const validData = baseData.filter((item) => {
    const value = item[dataKey];
    return value != null && !isNaN(value) && value > 0;
  });

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No training data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages with proper null handling
  const total = validData.reduce((sum, item) => {
    let value = item[dataKey];
    if (dataKey === 'totalVolume') {
      value = convertWeight(value || 0);
    }
    return sum + (value || 0);
  }, 0);

  const chartData: MuscleGroupData[] = validData.map((item) => {
    let value = item[dataKey] || 0;
    if (dataKey === 'totalVolume') {
      value = convertWeight(value);
    }
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return {
      ...item,
      name: item.name ?? item.primaryMuscle ?? 'Other',
      value,
      percentage: percentage.toFixed(1),
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {drilldown ? `Exercises for ${drilldown.muscle}` : title}
            </CardTitle>
            <CardDescription>
              {drilldown ? 'Volume by exercise' : description}
            </CardDescription>
          </div>
          {drilldown && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrilldown(null)}
            >
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loadingDrill ? (
          <div className="flex items-center justify-center h-[300px]">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={(data, index) => {
                  if (!drilldown) {
                    handleSliceClick(chartData[index]);
                  }
                }}
                cursor={drilldown ? 'default' : 'pointer'}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
