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
}: MuscleGroupChartProps) {
  const { convertWeight } = useUserPreferences();

  console.log(
    `[MuscleGroupChart] Rendering chart with ${data.length} muscle groups`,
  );

  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item[dataKey], 0);
  const chartData: MuscleGroupData[] = data.map((item) => ({
    ...item,
    name: item.primaryMuscle || 'Other',
    value:
      dataKey === 'totalVolume' ? convertWeight(item[dataKey]) : item[dataKey],
    percentage: ((item[dataKey] / total) * 100).toFixed(1),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
