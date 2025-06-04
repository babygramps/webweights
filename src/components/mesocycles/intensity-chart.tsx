'use client';
import logger from '@/lib/logger';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IntensityParameters,
  WeekIntensity,
  DEFAULT_INTENSITY,
  DELOAD_INTENSITY,
} from '@/types/progression';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface IntensityChartProps {
  weeks: number;
  weeklyProgressions: WeekIntensity[];
  onUpdateWeek: (
    weekNumber: number,
    intensity: IntensityParameters,
    isDeload?: boolean,
  ) => void;
  onUpdateLabel: (weekNumber: number, label: string) => void;
  selectedWeek?: number;
  onSelectWeek: (weekNumber: number) => void;
}

interface ChartDataPoint {
  week: number;
  volume: number;
  weight: number;
  intensity: number; // Combined intensity score
  rir: number;
  rpe: number;
  isDeload: boolean;
  label?: string;
}

export function IntensityChart({
  weeks,
  weeklyProgressions,
  onUpdateWeek,
  onUpdateLabel,
  selectedWeek,
  onSelectWeek,
}: IntensityChartProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'volume' | 'weight' | 'intensity'
  >('overview');

  // Calculate combined intensity score for visualization
  const calculateIntensityScore = useCallback(
    (params: IntensityParameters): number => {
      // Normalize different parameters to 0-100 scale and combine
      const volumeScore = params.volume;
      const weightScore = params.weight;
      const rirScore = (5 - params.rir) * 20; // RIR 0-5 -> 100-0
      const rpeScore = (params.rpe - 5) * 20; // RPE 5-10 -> 0-100

      // Weighted average of different components
      return (
        volumeScore * 0.3 + weightScore * 0.3 + rirScore * 0.2 + rpeScore * 0.2
      );
    },
    [],
  );

  // Transform data for chart
  const chartData = useMemo((): ChartDataPoint[] => {
    return Array.from({ length: weeks }, (_, i) => {
      const weekNumber = i + 1;
      const progression = weeklyProgressions.find((p) => p.week === weekNumber);
      const intensity = progression?.intensity || DEFAULT_INTENSITY;

      return {
        week: weekNumber,
        volume: intensity.volume,
        weight: intensity.weight,
        intensity: calculateIntensityScore(intensity),
        rir: intensity.rir,
        rpe: intensity.rpe,
        isDeload: progression?.isDeload || false,
        label: progression?.label,
      };
    });
  }, [weeks, weeklyProgressions, calculateIntensityScore]);

  const handleDeloadToggle = useCallback(
    (weekNumber: number) => {
      const currentProgression = weeklyProgressions.find(
        (p) => p.week === weekNumber,
      );
      const isCurrentlyDeload = currentProgression?.isDeload || false;

      const newIntensity = isCurrentlyDeload
        ? currentProgression?.intensity || DEFAULT_INTENSITY
        : DELOAD_INTENSITY;

      onUpdateWeek(weekNumber, newIntensity, !isCurrentlyDeload);
      logger.log(`Toggled deload for week ${weekNumber}:`, !isCurrentlyDeload);
    },
    [weeklyProgressions, onUpdateWeek],
  );

  const handleAutoDeload = useCallback(() => {
    // Automatically add deloads every 4th week
    for (let week = 4; week <= weeks; week += 4) {
      const currentProgression = weeklyProgressions.find(
        (p) => p.week === week,
      );
      if (!currentProgression?.isDeload) {
        onUpdateWeek(week, DELOAD_INTENSITY, true);
        onUpdateLabel(week, 'Deload Week');
      }
    }
    logger.log('Auto-applied deloads every 4th week');
  }, [weeks, weeklyProgressions, onUpdateWeek, onUpdateLabel]);

  const renderChart = useCallback(
    (dataKey: keyof ChartDataPoint, color: string, yAxisLabel: string) => (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as ChartDataPoint;
                return (
                  <div className="bg-white dark:bg-card/80 p-3 border rounded shadow-lg text-gray-900 dark:text-card-foreground">
                    <p className="font-semibold">Week {label}</p>
                    {data.isDeload && (
                      <Badge variant="secondary">Deload Week</Badge>
                    )}
                    {data.label && (
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">
                        {data.label}
                      </p>
                    )}
                    <p>
                      {yAxisLabel}: {payload[0].value}
                    </p>
                    <p>RIR: {data.rir}</p>
                    <p>RPE: {data.rpe}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {/* Highlight deload weeks */}
          {chartData
            .filter((d) => d.isDeload)
            .map((d) => (
              <ReferenceLine
                key={d.week}
                x={d.week}
                stroke="#ef4444"
                strokeDasharray="2 2"
                opacity={0.7}
              />
            ))}
          {/* Highlight selected week */}
          {selectedWeek && (
            <ReferenceLine x={selectedWeek} stroke="#3b82f6" strokeWidth={3} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    ),
    [chartData, selectedWeek],
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Intensity Progression</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoDeload}>
              Auto Deloads
            </Button>
            {selectedWeek && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeloadToggle(selectedWeek)}
              >
                Toggle Deload (Week {selectedWeek})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(tab) => setActiveTab(tab as typeof activeTab)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="intensity">Intensity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="bg-white dark:bg-card/80 p-3 border rounded shadow-lg text-gray-900 dark:text-card-foreground">
                          <p className="font-semibold">Week {label}</p>
                          {data.isDeload && (
                            <Badge variant="secondary">Deload Week</Badge>
                          )}
                          {data.label && (
                            <p className="text-sm text-gray-600 dark:text-muted-foreground">
                              {data.label}
                            </p>
                          )}
                          <p>Volume: {data.volume}%</p>
                          <p>Weight: {data.weight}%</p>
                          <p>Intensity: {data.intensity.toFixed(1)}</p>
                          <p>RIR: {data.rir}</p>
                          <p>RPE: {data.rpe}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="intensity"
                  stackId="3"
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.3}
                />
                {selectedWeek && (
                  <ReferenceLine
                    x={selectedWeek}
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="volume">
            {renderChart('volume', '#8884d8', 'Volume %')}
          </TabsContent>

          <TabsContent value="weight">
            {renderChart('weight', '#82ca9d', 'Weight %')}
          </TabsContent>

          <TabsContent value="intensity">
            {renderChart('intensity', '#ffc658', 'Combined Intensity')}
          </TabsContent>
        </Tabs>

        {/* Week selection grid */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Quick Week Selection</h4>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: weeks }, (_, i) => {
              const weekNumber = i + 1;
              const progression = weeklyProgressions.find(
                (p) => p.week === weekNumber,
              );
              const isDeload = progression?.isDeload || false;
              const isSelected = selectedWeek === weekNumber;

              return (
                <Button
                  key={weekNumber}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 ${isDeload ? 'border-red-400 bg-red-50' : ''}`}
                  onClick={() => onSelectWeek(weekNumber)}
                >
                  {weekNumber}
                  {isDeload && <span className="ml-1 text-red-600">D</span>}
                </Button>
              );
            })}
          </div>
        </div>

        {selectedWeek && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Selected: <strong>Week {selectedWeek}</strong>
              {weeklyProgressions.find((p) => p.week === selectedWeek)
                ?.isDeload && (
                <Badge variant="secondary" className="ml-2">
                  Deload
                </Badge>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
