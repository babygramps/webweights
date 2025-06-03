'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  IntensityParameters,
  WeekIntensity,
  DEFAULT_INTENSITY,
  DELOAD_INTENSITY,
} from '@/types/progression';

interface WeekConfigPanelProps {
  weekNumber: number;
  weekIntensity: WeekIntensity;
  onUpdateIntensity: (intensity: IntensityParameters) => void;
  onUpdateDeload: (isDeload: boolean) => void;
  onUpdateLabel: (label: string) => void;
  onUpdateNotes: (notes: string) => void;
}

export function WeekConfigPanel({
  weekNumber,
  weekIntensity,
  onUpdateIntensity,
  onUpdateDeload,
  onUpdateLabel,
  onUpdateNotes,
}: WeekConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'intensity' | 'details'>(
    'intensity',
  );

  const handleIntensityChange = useCallback(
    (param: keyof IntensityParameters, value: number) => {
      const updatedIntensity = {
        ...weekIntensity.intensity,
        [param]: value,
      };
      onUpdateIntensity(updatedIntensity);
      console.log(`Updated ${param} for week ${weekNumber}:`, value);
    },
    [weekIntensity.intensity, onUpdateIntensity, weekNumber],
  );

  const handleDeloadToggle = useCallback(
    (checked: boolean) => {
      console.log('[Switch] handleDeloadToggle called', {
        checked,
        currentIsDeload: weekIntensity.isDeload,
      });
      if (checked === weekIntensity.isDeload) {
        console.log('[Switch] handleDeloadToggle: No change, skipping update.');
        return;
      }
      onUpdateDeload(checked);
      if (checked) {
        onUpdateIntensity(DELOAD_INTENSITY);
        onUpdateLabel('Deload Week');
      } else {
        onUpdateIntensity(DEFAULT_INTENSITY);
        onUpdateLabel('');
      }
      console.log(`Toggled deload for week ${weekNumber}:`, checked);
    },
    [
      onUpdateDeload,
      onUpdateIntensity,
      onUpdateLabel,
      weekNumber,
      weekIntensity.isDeload,
    ],
  );

  const handlePresetApply = useCallback(
    (preset: 'easy' | 'moderate' | 'hard' | 'peak' | 'deload') => {
      const presets = {
        easy: {
          volume: 90,
          weight: 95,
          rir: 4,
          rpe: 6,
          sets: 0.9,
          repsModifier: 1.0,
        },
        moderate: {
          volume: 100,
          weight: 100,
          rir: 3,
          rpe: 7,
          sets: 1.0,
          repsModifier: 1.0,
        },
        hard: {
          volume: 110,
          weight: 105,
          rir: 2,
          rpe: 8,
          sets: 1.1,
          repsModifier: 1.0,
        },
        peak: {
          volume: 85,
          weight: 115,
          rir: 0,
          rpe: 9.5,
          sets: 0.85,
          repsModifier: 0.9,
        },
        deload: DELOAD_INTENSITY,
      };

      onUpdateIntensity(presets[preset]);
      onUpdateDeload(preset === 'deload');

      if (preset === 'deload') {
        onUpdateLabel('Deload Week');
      } else {
        onUpdateLabel(
          `${preset.charAt(0).toUpperCase() + preset.slice(1)} Week`,
        );
      }

      console.log(`Applied ${preset} preset to week ${weekNumber}`);
    },
    [onUpdateIntensity, onUpdateDeload, onUpdateLabel, weekNumber],
  );

  const calculateIntensityScore = useCallback(
    (params: IntensityParameters): number => {
      const volumeScore = params.volume;
      const weightScore = params.weight;
      const rirScore = (5 - params.rir) * 20;
      const rpeScore = (params.rpe - 5) * 20;
      return (
        volumeScore * 0.3 + weightScore * 0.3 + rirScore * 0.2 + rpeScore * 0.2
      );
    },
    [],
  );

  const intensityScore = calculateIntensityScore(weekIntensity.intensity);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Week {weekNumber} Configuration
            {weekIntensity.isDeload && (
              <Badge variant="secondary">Deload</Badge>
            )}
          </CardTitle>
          <div className="text-right">
            <div className="text-sm text-gray-600">Intensity Score</div>
            <div className="text-lg font-semibold">
              {intensityScore.toFixed(1)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(tab) => setActiveTab(tab as 'intensity' | 'details')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="intensity">Intensity</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="intensity" className="space-y-6">
            {/* Deload Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="deload-toggle">Deload Week</Label>
              <Switch
                id="deload-toggle"
                checked={weekIntensity.isDeload}
                onCheckedChange={handleDeloadToggle}
              />
            </div>

            {/* Quick Presets */}
            <div>
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetApply('easy')}
                >
                  Easy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetApply('moderate')}
                >
                  Moderate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetApply('hard')}
                >
                  Hard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetApply('peak')}
                >
                  Peak
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetApply('deload')}
                >
                  Deload
                </Button>
              </div>
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-gray-600">
                  {weekIntensity.intensity.volume}%
                </span>
              </div>
              <Slider
                value={[weekIntensity.intensity.volume]}
                onValueChange={(value: number[]) =>
                  handleIntensityChange('volume', value[0])
                }
                min={30}
                max={150}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>30%</span>
                <span>100%</span>
                <span>150%</span>
              </div>
            </div>

            {/* Weight Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Weight</Label>
                <span className="text-sm text-gray-600">
                  {weekIntensity.intensity.weight}%
                </span>
              </div>
              <Slider
                value={[weekIntensity.intensity.weight]}
                onValueChange={(value: number[]) =>
                  handleIntensityChange('weight', value[0])
                }
                min={70}
                max={125}
                step={2.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>70%</span>
                <span>100%</span>
                <span>125%</span>
              </div>
            </div>

            {/* RIR Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>RIR (Reps in Reserve)</Label>
                <span className="text-sm text-gray-600">
                  {weekIntensity.intensity.rir}
                </span>
              </div>
              <Slider
                value={[weekIntensity.intensity.rir]}
                onValueChange={(value: number[]) =>
                  handleIntensityChange('rir', value[0])
                }
                min={0}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 (failure)</span>
                <span>2-3 (moderate)</span>
                <span>5 (easy)</span>
              </div>
            </div>

            {/* RPE Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>RPE (Rate of Perceived Exertion)</Label>
                <span className="text-sm text-gray-600">
                  {weekIntensity.intensity.rpe}
                </span>
              </div>
              <Slider
                value={[weekIntensity.intensity.rpe]}
                onValueChange={(value: number[]) =>
                  handleIntensityChange('rpe', value[0])
                }
                min={5}
                max={10}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5 (easy)</span>
                <span>7-8 (moderate)</span>
                <span>10 (max effort)</span>
              </div>
            </div>

            {/* Sets Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Sets Multiplier</Label>
                <span className="text-sm text-gray-600">
                  {weekIntensity.intensity.sets.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[weekIntensity.intensity.sets]}
                onValueChange={(value: number[]) =>
                  handleIntensityChange('sets', value[0])
                }
                min={0.5}
                max={1.5}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>1.5x</span>
              </div>
            </div>

            {/* Reps Modifier */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Reps Modifier</Label>
                <span className="text-sm text-gray-600">
                  {weekIntensity.intensity.repsModifier.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[weekIntensity.intensity.repsModifier]}
                onValueChange={(value: number[]) =>
                  handleIntensityChange('repsModifier', value[0])
                }
                min={0.7}
                max={1.3}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.7x</span>
                <span>1.0x</span>
                <span>1.3x</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Week Label */}
            <div className="space-y-2">
              <Label htmlFor="week-label">Week Label</Label>
              <Input
                id="week-label"
                value={weekIntensity.label || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateLabel(e.target.value)
                }
                placeholder="e.g., Build Week, Peak Week, Deload"
              />
            </div>

            {/* Week Notes */}
            <div className="space-y-2">
              <Label htmlFor="week-notes">Notes</Label>
              <Textarea
                id="week-notes"
                value={weekIntensity.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onUpdateNotes(e.target.value)
                }
                placeholder="Special instructions, modifications, or reminders for this week..."
                rows={4}
              />
            </div>

            {/* Intensity Summary */}
            <div className="space-y-2">
              <Label>Intensity Summary</Label>
              <div className="p-3 bg-gray-50 dark:bg-card/80 rounded-lg space-y-2 text-gray-900 dark:text-card-foreground">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Volume:</span>{' '}
                    {weekIntensity.intensity.volume}%
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span>{' '}
                    {weekIntensity.intensity.weight}%
                  </div>
                  <div>
                    <span className="font-medium">RIR:</span>{' '}
                    {weekIntensity.intensity.rir}
                  </div>
                  <div>
                    <span className="font-medium">RPE:</span>{' '}
                    {weekIntensity.intensity.rpe}
                  </div>
                  <div>
                    <span className="font-medium">Sets:</span>{' '}
                    {weekIntensity.intensity.sets.toFixed(2)}x
                  </div>
                  <div>
                    <span className="font-medium">Reps:</span>{' '}
                    {weekIntensity.intensity.repsModifier.toFixed(2)}x
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <span className="font-medium">Overall Intensity Score:</span>{' '}
                  {intensityScore.toFixed(1)}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
