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
import { formatLocalDate } from '@/lib/utils/date';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import { calculateAverage1RM } from '@/lib/utils/1rm-calculator';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const [selectedMetric, setSelectedMetric] = useState<
    'weight' | 'reps' | 'volume' | 'oneRm'
  >('weight');

  // Calculate averages for reference lines
  const avgWeight = data.reduce((sum, d) => sum + d.weight, 0) / data.length;
  const avgReps = data.reduce((sum, d) => sum + d.reps, 0) / data.length;
  const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;

  // Format data for chart
  const chartData: (ExerciseProgressData & { oneRm: number })[] = data.map(
    (d) => ({
      ...d,
      date: formatLocalDate(d.date, 'MM/dd/yyyy'),
      intensity:
        d.rir !== undefined
          ? `${d.rir} RIR`
          : d.rpe !== undefined
            ? `${d.rpe} RPE`
            : undefined,
      oneRm: calculateAverage1RM(d.weight, d.reps),
    }),
  );

  const avgOneRm =
    chartData.reduce((sum, d) => sum + d.oneRm, 0) / chartData.length;

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{exerciseName} Progress</CardTitle>
            <CardDescription>Track your performance over time</CardDescription>
          </div>
          <Select
            value={selectedMetric}
            onValueChange={(v) => setSelectedMetric(v as typeof selectedMetric)}
          >
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="reps">Reps</SelectItem>
              {showVolume && <SelectItem value="volume">Volume</SelectItem>}
              {showOneRM && <SelectItem value="oneRm">1RM</SelectItem>}
            </SelectContent>
          </Select>
        </div>
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
              hide={
                !(selectedMetric === 'weight' || selectedMetric === 'oneRm')
              }
              label={{
                value:
                  selectedMetric === 'weight'
                    ? `Weight (${weightUnit})`
                    : selectedMetric === 'oneRm'
                      ? `1RM (${weightUnit})`
                      : '',
                angle: -90,
                position: 'insideLeft',
                className: 'text-xs',
              }}
              className="text-xs"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              hide={!(selectedMetric === 'reps' || selectedMetric === 'volume')}
              label={{
                value:
                  selectedMetric === 'reps'
                    ? 'Reps'
                    : selectedMetric === 'volume'
                      ? `Volume (${weightUnit})`
                      : '',
                angle: 90,
                position: 'insideRight',
                className: 'text-xs',
              }}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Reference line for average */}
            <ReferenceLine
              yAxisId={
                selectedMetric === 'weight' || selectedMetric === 'oneRm'
                  ? 'left'
                  : 'right'
              }
              y={
                selectedMetric === 'weight'
                  ? avgWeight
                  : selectedMetric === 'reps'
                    ? avgReps
                    : selectedMetric === 'volume'
                      ? avgVolume
                      : avgOneRm
              }
              stroke="#888"
              strokeDasharray="5 5"
              label={`Avg: ${(selectedMetric === 'weight'
                ? avgWeight
                : selectedMetric === 'reps'
                  ? avgReps
                  : selectedMetric === 'volume'
                    ? avgVolume
                    : avgOneRm
              ).toFixed(1)}`}
            />

            {selectedMetric === 'weight' && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Weight"
                dot={{ r: 4 }}
              />
            )}
            {selectedMetric === 'oneRm' && showOneRM && (
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
            {selectedMetric === 'reps' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="reps"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Reps"
                dot={{ r: 4 }}
              />
            )}
            {selectedMetric === 'volume' && showVolume && (
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
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {selectedMetric === 'weight'
                ? 'Max Weight'
                : selectedMetric === 'reps'
                  ? 'Max Reps'
                  : selectedMetric === 'volume'
                    ? 'Max Volume'
                    : 'Max 1RM'}
            </p>
            <p className="text-lg font-semibold">
              {selectedMetric === 'weight' &&
                `${Math.max(...data.map((d) => d.weight))} ${weightUnit}`}
              {selectedMetric === 'reps' &&
                Math.max(...data.map((d) => d.reps))}
              {selectedMetric === 'volume' &&
                `${Math.max(...data.map((d) => d.volume))} ${weightUnit}`}
              {selectedMetric === 'oneRm' &&
                `${Math.max(...chartData.map((d) => d.oneRm))} ${weightUnit}`}
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
