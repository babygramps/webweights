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
import { formatLocalDate } from '@/lib/utils/date';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';

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
    const formattedLabel = (() => {
      try {
        return formatLocalDate(label, 'MM/dd/yyyy');
      } catch {
        return label;
      }
    })();
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{formattedLabel}</p>
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
      return formatLocalDate(value, 'MM/dd/yyyy');
    } catch {
      return value;
    }
  },
  tooltipFormat = 'default',
}: ProgressChartProps) {
  const { weightUnit, convertWeight } = useUserPreferences();

  const Chart = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  const formatTooltip = (value: number): string => {
    if (tooltipFormat === 'kilo') {
      const convertedValue = convertWeight(value);
      return `${(convertedValue / 1000).toFixed(1)}k ${weightUnit}`;
    }
    return String(value);
  };

  // Convert data if it includes weight values
  const convertedData =
    tooltipFormat === 'kilo'
      ? data.map((item) => ({
          ...item,
          [dataKey]:
            typeof item[dataKey] === 'number'
              ? convertWeight(item[dataKey] as number)
              : item[dataKey],
        }))
      : data;

  // Update y-axis label with unit
  const updatedYAxisLabel =
    yAxisLabel?.includes('Volume') || yAxisLabel?.includes('lbs')
      ? `Volume (${weightUnit})`
      : yAxisLabel;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <Chart
            data={convertedData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              tickFormatter={formatXAxis}
              className="text-xs"
            />
            <YAxis
              label={{
                value: updatedYAxisLabel,
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
