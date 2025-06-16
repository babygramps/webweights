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
import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface ExerciseProgressData {
  date: Date | string;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  volume: number;
  sets?: number;
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
    'weight' | 'reps' | 'volume' | 'oneRm' | 'sets'
  >('weight');
  const [smoothingMethod, setSmoothingMethod] = useState<
    | 'none'
    | 'sma'
    | 'ema'
    | 'loess'
    | 'spline'
    | 'kalman'
    | 'cumulative'
    | 'aggregate'
    | 'poly'
    | 'smoothed1rm'
  >('none');

  const smoothingDescriptions: Record<string, string> = {
    sma: 'Simple Moving Average – averages the last n points',
    ema: 'Exponential Moving Average – weights recent points more',
    loess: 'Loess smoothing – locally weighted regression',
    spline: 'Spline – smooth piecewise polynomial curve',
    kalman: 'Kalman Filter – predictive filter for noisy data',
    cumulative: 'Cumulative Average – running average over time',
    aggregate: 'Weekly Avg – aggregates values by week',
    poly: 'Polynomial Regression – curved trend line',
    smoothed1rm: 'Smoothed 1RM – moving avg of est. 1RM',
  };

  // Calculate averages for reference lines
  const avgWeight = data.reduce((sum, d) => sum + d.weight, 0) / data.length;
  const avgReps = data.reduce((sum, d) => sum + d.reps, 0) / data.length;
  const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
  const avgSets = data.reduce((sum, d) => sum + (d.sets ?? 1), 0) / data.length;

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
      sets: d.sets ?? 1,
    }),
  );

  const avgOneRm =
    chartData.reduce((sum, d) => sum + d.oneRm, 0) / chartData.length;

  // Simple Moving Average
  const movingAverage = (values: number[], window = 5) =>
    values.map((_, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = values.slice(start, i + 1);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });

  // Exponential Moving Average
  const exponentialMovingAverage = (values: number[], alpha = 0.5) => {
    const result: number[] = [];
    values.forEach((value, idx) => {
      if (idx === 0) {
        result.push(value);
      } else {
        result.push(alpha * value + (1 - alpha) * result[idx - 1]);
      }
    });
    return result;
  };

  // Cumulative Average
  const cumulativeAverage = (values: number[]) => {
    const result: number[] = [];
    values.reduce((sum, v, i) => {
      const newSum = sum + v;
      result[i] = newSum / (i + 1);
      return newSum;
    }, 0);
    return result;
  };

  // Very simple LOESS implementation
  const loess = (values: number[], bandwidth = 0.3) => {
    const n = values.length;
    return values.map((_, i) => {
      const distances = values.map((_, j) => Math.abs(i - j));
      const bandwidthDistance = bandwidth * n;
      const weights = distances.map((d) => {
        const w = 1 - Math.pow(d / bandwidthDistance, 3);
        return w > 0 ? Math.pow(w, 3) : 0;
      });
      const weightedSum = values.reduce(
        (sum, val, idx) => sum + val * weights[idx],
        0,
      );
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      return totalWeight ? weightedSum / totalWeight : values[i];
    });
  };

  // Basic polynomial regression (2nd order)
  const polynomialRegression = (values: number[], degree = 2) => {
    const n = values.length;
    const X: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row = [] as number[];
      for (let j = 0; j <= degree; j++) {
        row.push(Math.pow(i, j));
      }
      X.push(row);
    }
    // Normal equation: (X^T X)^-1 X^T y
    const XT = X[0].map((_, colIndex) => X.map((row) => row[colIndex]));
    const XTX = XT.map((row) =>
      XT[0].map((_, j) => row.reduce((sum, x, k) => sum + x * X[k][j], 0)),
    );
    // Invert XTX (assuming small 3x3)
    const det =
      XTX[0][0] * (XTX[1][1] * XTX[2][2] - XTX[1][2] * XTX[2][1]) -
      XTX[0][1] * (XTX[1][0] * XTX[2][2] - XTX[1][2] * XTX[2][0]) +
      XTX[0][2] * (XTX[1][0] * XTX[2][1] - XTX[1][1] * XTX[2][0]);
    if (!det) return values;
    const inv = [
      [
        (XTX[1][1] * XTX[2][2] - XTX[1][2] * XTX[2][1]) / det,
        (XTX[0][2] * XTX[2][1] - XTX[0][1] * XTX[2][2]) / det,
        (XTX[0][1] * XTX[1][2] - XTX[0][2] * XTX[1][1]) / det,
      ],
      [
        (XTX[1][2] * XTX[2][0] - XTX[1][0] * XTX[2][2]) / det,
        (XTX[0][0] * XTX[2][2] - XTX[0][2] * XTX[2][0]) / det,
        (XTX[0][2] * XTX[1][0] - XTX[0][0] * XTX[1][2]) / det,
      ],
      [
        (XTX[1][0] * XTX[2][1] - XTX[1][1] * XTX[2][0]) / det,
        (XTX[0][1] * XTX[2][0] - XTX[0][0] * XTX[2][1]) / det,
        (XTX[0][0] * XTX[1][1] - XTX[0][1] * XTX[1][0]) / det,
      ],
    ];
    const XTy = XT.map((row) =>
      row.reduce((sum, x, i) => sum + x * values[i], 0),
    );
    const coeffs = inv.map((row) =>
      row.reduce((sum, v, i) => sum + v * XTy[i], 0),
    );
    return X.map((row) => row.reduce((sum, v, i) => sum + v * coeffs[i], 0));
  };

  // Simple 1D Kalman filter
  const kalmanFilter = (values: number[], R = 0.01, Q = 1) => {
    let x = values[0];
    let p = 1;
    const result = [x];
    for (let i = 1; i < values.length; i++) {
      // prediction
      p += Q;
      // update
      const k = p / (p + R);
      x = x + k * (values[i] - x);
      p = (1 - k) * p;
      result.push(x);
    }
    return result;
  };

  const chartWithAvg = useMemo(() => {
    const metricKey = selectedMetric === 'oneRm' ? 'oneRm' : selectedMetric;
    const values = chartData.map((d) => {
      switch (metricKey) {
        case 'oneRm':
          return d.oneRm;
        case 'weight':
          return d.weight;
        case 'reps':
          return d.reps;
        case 'volume':
          return d.volume;
        case 'sets':
          return d.sets ?? 1;
        default:
          return 0;
      }
    });
    let smoothed: number[] = [];
    switch (smoothingMethod) {
      case 'sma':
        smoothed = movingAverage(values);
        break;
      case 'ema':
        smoothed = exponentialMovingAverage(values);
        break;
      case 'loess':
        smoothed = loess(values);
        break;
      case 'spline':
        smoothed = polynomialRegression(values, 3);
        break;
      case 'kalman':
        smoothed = kalmanFilter(values);
        break;
      case 'cumulative':
        smoothed = cumulativeAverage(values);
        break;
      case 'aggregate':
        // Simple weekly aggregation
        smoothed = values.map((_, i) => {
          const start = Math.max(0, i - 6);
          const slice = values.slice(start, i + 1);
          return slice.reduce((a, b) => a + b, 0) / slice.length;
        });
        break;
      case 'poly':
        smoothed = polynomialRegression(values, 2);
        break;
      case 'smoothed1rm':
        smoothed = movingAverage(
          chartData.map((d) => calculateAverage1RM(d.weight, d.reps)),
        );
        break;
      default:
        smoothed = [];
    }
    const result = smoothed.length
      ? chartData.map((d, idx) => ({ ...d, movingAvg: smoothed[idx] }))
      : chartData;
    return result;
  }, [chartData, selectedMetric, smoothingMethod]);

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
              {entry.dataKey === 'sets' && ' sets'}
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
          <div className="flex items-center gap-4">
            <Select
              value={selectedMetric}
              onValueChange={(v) =>
                setSelectedMetric(v as typeof selectedMetric)
              }
            >
              <SelectTrigger size="sm" className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="reps">Reps</SelectItem>
                {showVolume && <SelectItem value="volume">Volume</SelectItem>}
                {showOneRM && <SelectItem value="oneRm">1RM</SelectItem>}
                <SelectItem value="sets">Sets</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={smoothingMethod}
              onValueChange={(v) =>
                setSmoothingMethod(v as typeof smoothingMethod)
              }
            >
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue placeholder="Smoothing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Smoothing</SelectItem>
                <SelectItem value="sma" title={smoothingDescriptions.sma}>
                  SMA
                </SelectItem>
                <SelectItem value="ema" title={smoothingDescriptions.ema}>
                  EMA
                </SelectItem>
                <SelectItem value="loess" title={smoothingDescriptions.loess}>
                  Loess
                </SelectItem>
                <SelectItem value="spline" title={smoothingDescriptions.spline}>
                  Spline
                </SelectItem>
                <SelectItem value="kalman" title={smoothingDescriptions.kalman}>
                  Kalman
                </SelectItem>
                <SelectItem
                  value="cumulative"
                  title={smoothingDescriptions.cumulative}
                >
                  Cumulative
                </SelectItem>
                <SelectItem
                  value="aggregate"
                  title={smoothingDescriptions.aggregate}
                >
                  Weekly Avg
                </SelectItem>
                <SelectItem value="poly" title={smoothingDescriptions.poly}>
                  Polynomial
                </SelectItem>
                <SelectItem
                  value="smoothed1rm"
                  title={smoothingDescriptions.smoothed1rm}
                >
                  Smoothed 1RM
                </SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <HelpCircle className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="text-sm space-y-1 w-72" side="bottom">
                <p className="font-medium mb-2">Smoothing methods</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>{smoothingDescriptions.sma}</li>
                  <li>{smoothingDescriptions.ema}</li>
                  <li>{smoothingDescriptions.loess}</li>
                  <li>{smoothingDescriptions.spline}</li>
                  <li>{smoothingDescriptions.kalman}</li>
                  <li>{smoothingDescriptions.cumulative}</li>
                  <li>{smoothingDescriptions.aggregate}</li>
                  <li>{smoothingDescriptions.poly}</li>
                  <li>{smoothingDescriptions.smoothed1rm}</li>
                </ul>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartWithAvg}
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
              hide={
                !(
                  selectedMetric === 'reps' ||
                  selectedMetric === 'volume' ||
                  selectedMetric === 'sets'
                )
              }
              label={{
                value:
                  selectedMetric === 'reps'
                    ? 'Reps'
                    : selectedMetric === 'volume'
                      ? `Volume (${weightUnit})`
                      : selectedMetric === 'sets'
                        ? 'Sets'
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
                      : selectedMetric === 'sets'
                        ? avgSets
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
                    : selectedMetric === 'sets'
                      ? avgSets
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
            {selectedMetric === 'sets' && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sets"
                stroke="#f43f5e"
                strokeWidth={1}
                name="Sets"
                dot={{ r: 3 }}
              />
            )}
            {smoothingMethod !== 'none' && (
              <Line
                yAxisId={
                  selectedMetric === 'reps' ||
                  selectedMetric === 'volume' ||
                  selectedMetric === 'sets'
                    ? 'right'
                    : 'left'
                }
                type="monotone"
                dataKey="movingAvg"
                stroke="#f97316"
                strokeWidth={2}
                name="Trend"
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
                    : selectedMetric === 'sets'
                      ? 'Max Sets'
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
              {selectedMetric === 'sets' &&
                Math.max(...chartData.map((d) => d.sets ?? 1))}
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
