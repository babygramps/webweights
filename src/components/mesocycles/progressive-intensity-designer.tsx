'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { IntensityChart } from './intensity-chart';
import { WeekConfigPanel } from './week-config-panel';
import {
  IntensityParameters,
  WeekIntensity,
  DEFAULT_INTENSITY,
  ProgressionType,
  MesocycleProgression,
  GlobalProgressionSettings,
} from '@/types/progression';
import {
  PROGRESSION_TEMPLATES,
  applyProgressionTemplate,
} from '@/lib/progression-templates';
import { getStrategyForTemplate } from '@/lib/utils/template-strategy-utils';
import { ProgressionStrategySelector } from './progression-strategy-selector';
import {
  ProgressionStrategy,
  DEFAULT_STRATEGIES,
} from '@/types/progression-strategy';

interface ProgressiveIntensityDesignerProps {
  mesocycleWeeks: number;
  initialProgression?: MesocycleProgression;
  onProgressionChange: (progression: MesocycleProgression) => void;
}

export function ProgressiveIntensityDesigner({
  mesocycleWeeks,
  initialProgression,
  onProgressionChange,
}: ProgressiveIntensityDesignerProps) {
  // Initialize state with default or provided progression
  const [weeklyProgressions, setWeeklyProgressions] = useState<WeekIntensity[]>(
    () => {
      if (initialProgression?.weeklyProgressions) {
        return initialProgression.weeklyProgressions;
      }

      // Create default progressions
      return Array.from({ length: mesocycleWeeks }, (_, i) => ({
        week: i + 1,
        intensity: DEFAULT_INTENSITY,
        isDeload: false,
      }));
    },
  );

  const [progressionStrategy, setProgressionStrategy] =
    useState<ProgressionStrategy>(
      initialProgression?.progressionStrategy || DEFAULT_STRATEGIES.hypertrophy,
    );

  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(
    undefined,
  );
  const [progressionType, setProgressionType] = useState<ProgressionType>(
    initialProgression?.progressionType || 'linear',
  );

  console.log('[ProgressiveIntensityDesigner] Rendering with:', {
    mesocycleWeeks,
    hasProgression: !!initialProgression,
    progressionType: progressionType,
    progressionStrategy,
  });

  const [globalSettings] = useState<GlobalProgressionSettings>(
    initialProgression?.globalSettings || {
      autoDeload: true,
      deloadFrequency: 4,
      deloadIntensity: 70,
      mainLiftProgression: 2.5,
      accessoryProgression: 5,
      fatigueThreshold: 8.5,
    },
  );



  const initialTab: 'chart' | 'template' | 'settings' | 'strategy' = 'template'; // Always start with template tab

  const [activeTab, setActiveTab] = useState<
    'chart' | 'template' | 'settings' | 'strategy'
  >(initialTab);
  const hasEmittedInitial = React.useRef(false);

  // Store original intensities for each week when deload is toggled on
  const originalIntensitiesRef = React.useRef<
    Record<number, IntensityParameters>
  >({});

  // Helper function to create and emit progression
  const createAndEmitProgression = useCallback(
    (updatedProgressions: WeekIntensity[], updatedType?: ProgressionType) => {
      const progression: MesocycleProgression = {
        id: initialProgression?.id || '',
        mesocycleId: initialProgression?.mesocycleId || '',
        baselineWeek: updatedProgressions[0] || {
          week: 1,
          intensity: DEFAULT_INTENSITY,
          isDeload: false,
        },
        weeklyProgressions: updatedProgressions,
        progressionType: updatedType || progressionType,
        globalSettings,
        progressionStrategy,
      };
      onProgressionChange(progression);
    },
    [
      initialProgression,
      progressionType,
      globalSettings,
      progressionStrategy,
      onProgressionChange,
    ],
  );

  // Store the latest createAndEmitProgression function in a ref to avoid stale closures
  const createAndEmitProgressionRef = React.useRef(createAndEmitProgression);
  createAndEmitProgressionRef.current = createAndEmitProgression;

  // Store the latest weeklyProgressions in a ref for initial emission
  const weeklyProgressionsRef = React.useRef(weeklyProgressions);
  weeklyProgressionsRef.current = weeklyProgressions;

  // Emit initial progression data on mount (after render is complete)
  React.useEffect(() => {
    if (!hasEmittedInitial.current) {
      // Use setTimeout to defer until after render is complete
      const timeoutId = setTimeout(() => {
        createAndEmitProgressionRef.current(weeklyProgressionsRef.current);
        hasEmittedInitial.current = true;
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, []); // Empty deps to only run on mount

  // Emit changes when progression settings update (after initial emission)
  React.useEffect(() => {
    if (hasEmittedInitial.current) {
      createAndEmitProgressionRef.current(weeklyProgressions);
    }
  }, [progressionType, progressionStrategy, weeklyProgressions]);

  // Current week intensity for the panel
  const currentWeekIntensity = useMemo(() => {
    if (selectedWeek === undefined) {
      return {
        week: 1,
        intensity: DEFAULT_INTENSITY,
        isDeload: false,
      } as WeekIntensity;
    }

    return (
      weeklyProgressions.find((p) => p.week === selectedWeek) ||
      ({
        week: selectedWeek,
        intensity: DEFAULT_INTENSITY,
        isDeload: false,
      } as WeekIntensity)
    );
  }, [weeklyProgressions, selectedWeek]);

  // Update a specific week's intensity
  const handleUpdateWeek = useCallback(
    (
      weekNumber: number,
      intensity: IntensityParameters,
      isDeload?: boolean,
    ) => {
      setWeeklyProgressions((prev) => {
        const prevWeek = prev.find((p) => p.week === weekNumber);

        // If toggling deload ON, store the original intensity
        if (
          typeof isDeload === 'boolean' &&
          isDeload &&
          prevWeek &&
          !prevWeek.isDeload
        ) {
          originalIntensitiesRef.current[weekNumber] = prevWeek.intensity;
        }

        // If toggling deload OFF, restore the original intensity if available
        let nextIntensity = intensity;
        if (
          typeof isDeload === 'boolean' &&
          !isDeload &&
          prevWeek &&
          prevWeek.isDeload
        ) {
          const original = originalIntensitiesRef.current[weekNumber];
          if (original) {
            nextIntensity = original;
            delete originalIntensitiesRef.current[weekNumber];
          }
        }

        const updated = prev.map((p) =>
          p.week === weekNumber
            ? {
                ...p,
                intensity: nextIntensity,
                isDeload: isDeload ?? p.isDeload,
              }
            : p,
        );
        if (!updated.find((p) => p.week === weekNumber)) {
          updated.push({
            week: weekNumber,
            intensity: nextIntensity,
            isDeload: isDeload || false,
          });
        }
        const sortedUpdated = updated.sort((a, b) => a.week - b.week);
        console.log('[ProgressiveIntensityDesigner] handleUpdateWeek', {
          weekNumber,
          intensity: nextIntensity,
          isDeload,
          prev,
          sortedUpdated,
        });
        createAndEmitProgressionRef.current(sortedUpdated);
        return sortedUpdated;
      });
    },
    [createAndEmitProgressionRef],
  );

  // Update a week's label
  const handleUpdateLabel = useCallback(
    (weekNumber: number, label: string) => {
      setWeeklyProgressions((prev) => {
        const updated = prev.map((p) =>
          p.week === weekNumber ? { ...p, label } : p,
        );

        // Emit changes immediately
        createAndEmitProgressionRef.current(updated);

        return updated;
      });
    },
    [createAndEmitProgressionRef],
  );

  // Update a week's notes
  const handleUpdateNotes = useCallback(
    (weekNumber: number, notes: string) => {
      setWeeklyProgressions((prev) => {
        const updated = prev.map((p) =>
          p.week === weekNumber ? { ...p, notes } : p,
        );

        // Emit changes immediately
        createAndEmitProgressionRef.current(updated);

        return updated;
      });
    },
    [createAndEmitProgressionRef],
  );

  // Apply a progression template
  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      try {
        const weekPattern = applyProgressionTemplate(
          templateId,
          mesocycleWeeks,
        );
        const template = PROGRESSION_TEMPLATES.find((t) => t.id === templateId);

        if (!template) return;

        const newProgressions: WeekIntensity[] = weekPattern.map(
          (intensity, index) => ({
            week: index + 1,
            intensity,
            isDeload: intensity.volume <= 75, // Auto-detect deloads
            label: intensity.volume <= 75 ? 'Deload Week' : undefined,
          }),
        );

        setWeeklyProgressions(newProgressions);
        setProgressionType(template.type);
        const strategy = getStrategyForTemplate(template);
        setProgressionStrategy(strategy);
        setActiveTab('chart');

        // Emit changes immediately
        createAndEmitProgressionRef.current(newProgressions, template.type);

        console.log(`Applied template: ${template.name}`);
      } catch (error) {
        console.error('Error applying template:', error);
      }
    },
    [mesocycleWeeks, createAndEmitProgressionRef],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progressive Intensity Designer</span>
            <Badge variant="outline">{mesocycleWeeks} Weeks</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(tab) =>
              setActiveTab(
                tab as 'chart' | 'template' | 'settings' | 'strategy',
              )
            }
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="template">Templates</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              <IntensityChart
                weeks={mesocycleWeeks}
                weeklyProgressions={weeklyProgressions}
                onUpdateWeek={handleUpdateWeek}
                onUpdateLabel={handleUpdateLabel}
                selectedWeek={selectedWeek}
                onSelectWeek={setSelectedWeek}
              />
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROGRESSION_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {template.name}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {template.targetGoal}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {template.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {template.duration} weeks • {template.type}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleApplyTemplate(template.id)}
                        >
                          Apply Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4">
              <ProgressionStrategySelector
                currentStrategy={progressionStrategy}
                onStrategyChange={(newStrategy) => {
                  console.log(
                    '[ProgressiveIntensityDesigner] Strategy changed:',
                    newStrategy,
                  );
                  setProgressionStrategy(newStrategy);
                  createAndEmitProgressionRef.current(weeklyProgressions);
                }}
                showDemo={true}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progression Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={progressionType}
                          onValueChange={(value) =>
                            setProgressionType(value as ProgressionType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="wave">Wave Loading</SelectItem>
                            <SelectItem value="block">
                              Block Periodization
                            </SelectItem>
                            <SelectItem value="undulating">
                              Daily Undulating
                            </SelectItem>
                            <SelectItem value="step">Step Loading</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Global Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Auto Deload</Label>
                          <p className="text-gray-600">
                            {globalSettings.autoDeload ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <div>
                          <Label>Deload Frequency</Label>
                          <p className="text-gray-600">
                            Every {globalSettings.deloadFrequency} weeks
                          </p>
                        </div>
                        <div>
                          <Label>Main Lift Progression</Label>
                          <p className="text-gray-600">
                            {globalSettings.mainLiftProgression}% per week
                          </p>
                        </div>
                        <div>
                          <Label>Accessory Progression</Label>
                          <p className="text-gray-600">
                            {globalSettings.accessoryProgression}% per week
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Week Configuration Panel */}
      {selectedWeek && (
        <WeekConfigPanel
          weekNumber={selectedWeek}
          weekIntensity={currentWeekIntensity}
          onUpdateIntensity={(intensity) =>
            handleUpdateWeek(selectedWeek, intensity)
          }
          onUpdateDeload={(isDeload) =>
            handleUpdateWeek(
              selectedWeek,
              currentWeekIntensity.intensity,
              isDeload,
            )
          }
          onUpdateLabel={(label) => handleUpdateLabel(selectedWeek, label)}
          onUpdateNotes={(notes) => handleUpdateNotes(selectedWeek, notes)}
        />
      )}
    </div>
  );
}
