'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import { calculateAverage1RM } from '@/lib/utils/1rm-calculator';

interface ExerciseProgressData {
  date: Date | string;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  volume: number;
  intensity?: string;
}

interface ExerciseProgressChartProps {
  exerciseName: string;
  data: ExerciseProgressData[];
  showVolume?: boolean;
  showOneRM?: boolean;
}

export function ExerciseProgressChart({
  exerciseName,
  data,
  showVolume = true,
  showOneRM = false,
}: ExerciseProgressChartProps) {
  const { weightUnit } = useUserPreferences();

  // Calculate averages for reference lines
  const avgWeight = data.reduce((sum, d) => sum + d.weight, 0) / data.length;

  // Format data for chart
  const chartData: (ExerciseProgressData & { oneRm: number })[] = data.map(
    (d) => ({
      ...d,
      date: typeof d.date === 'string' ? d.date : format(d.date, 'MMM d'),
      intensity:
        d.rir !== undefined
          ? `${d.rir} RIR`
          : d.rpe !== undefined
            ? `${d.rpe} RPE`
            : undefined,
      oneRm: calculateAverage1RM(d.weight, d.reps),
    }),
  );

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: import('recharts').TooltipProps<string, string>) => {
    if (active && payload && payload.length) {
      const firstPayload = payload[0];
      const payloadData = firstPayload.payload as ExerciseProgressData & {
        oneRm?: number;
      };
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'weight' && ` ${weightUnit}`}
              {entry.dataKey === 'volume' && ` ${weightUnit}`}
              {entry.dataKey === 'oneRm' && ` ${weightUnit}`}
            </p>
          ))}
          {payloadData.intensity && (
            <p className="text-sm text-muted-foreground">
              Intensity: {payloadData.intensity}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exerciseName} Progress</CardTitle>
        <CardDescription>Track your performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis
              yAxisId="left"
              label={{
                value: `Weight (${weightUnit})`,
                angle: -90,
                position: 'insideLeft',
                className: 'text-xs',
              }}
              className="text-xs"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: 'Reps / Volume',
                angle: 90,
                position: 'insideRight',
                className: 'text-xs',
              }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Reference lines for averages */}
            <ReferenceLine
              yAxisId="left"
              y={avgWeight}
              stroke="#888"
              strokeDasharray="5 5"
              label={`Avg: ${avgWeight.toFixed(1)}`}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Weight"
              dot={{ r: 4 }}
            />
            {showOneRM && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="oneRm"
                stroke="#ef4444"
                strokeWidth={2}
                name="1RM"
                dot={{ r: 4 }}
              />
            )}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="reps"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Reps"
              dot={{ r: 4 }}
            />
            {showVolume && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volume"
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Volume"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Max Weight</p>
            <p className="text-lg font-semibold">
              {Math.max(...data.map((d) => d.weight))} {weightUnit}
            </p>
          </div>
          {showOneRM && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Max 1RM</p>
              <p className="text-lg font-semibold">
                {Math.max(...chartData.map((d) => d.oneRm))} {weightUnit}
              </p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Max Reps</p>
            <p className="text-lg font-semibold">
              {Math.max(...data.map((d) => d.reps))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Max Volume</p>
            <p className="text-lg font-semibold">
              {Math.max(...data.map((d) => d.volume))} {weightUnit}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Sets</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
