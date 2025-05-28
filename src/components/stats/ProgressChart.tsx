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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from 'recharts';
import { format } from 'date-fns';

interface ProgressChartData {
  date: string;
  [key: string]: number | string;
}

interface ProgressChartProps {
  title: string;
  description?: string;
  data: ProgressChartData[];
  dataKey: string;
  xAxisKey?: string;
  yAxisLabel?: string;
  chartType?: 'line' | 'bar';
  color?: string;
  height?: number;
  formatXAxis?: (value: string) => string;
  tooltipFormat?: 'kilo' | 'default';
}

const CustomTooltip = ({
  active,
  payload,
  label,
  formatTooltip,
}: TooltipProps<string, string> & {
  formatTooltip?: (value: number) => string;
}) => {
  if (active && payload && payload.length) {
    const payloadValue = payload[0].value;
    const numericValue =
      typeof payloadValue === 'number'
        ? payloadValue
        : parseFloat(payloadValue || '0');
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary">
          {formatTooltip ? formatTooltip(numericValue) : payloadValue}
        </p>
      </div>
    );
  }
  return null;
};

export function ProgressChart({
  title,
  description,
  data,
  dataKey,
  xAxisKey = 'date',
  yAxisLabel,
  chartType = 'line',
  color = '#8b5cf6',
  height = 300,
  formatXAxis = (value: string) => {
    try {
      return format(new Date(value), 'MMM d');
    } catch {
      return value;
    }
  },
  tooltipFormat = 'default',
}: ProgressChartProps) {
  console.log(
    `[ProgressChart] Rendering ${chartType} chart for ${title} with ${data.length} data points`,
  );

  const Chart = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  const formatTooltip = (value: number): string => {
    if (tooltipFormat === 'kilo') {
      return `${(value / 1000).toFixed(1)}k lbs`;
    }
    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <Chart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={formatXAxis}
              className="text-xs"
            />
            <YAxis
              label={{
                value: yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                className: 'text-xs',
              }}
              className="text-xs"
            />
            <Tooltip
              content={<CustomTooltip formatTooltip={formatTooltip} />}
            />
            <Legend />
            <DataComponent
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              strokeWidth={chartType === 'line' ? 2 : undefined}
              name={title}
            />
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
