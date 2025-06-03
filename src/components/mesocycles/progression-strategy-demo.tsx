'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressionStrategy } from '@/types/progression-strategy';
import { WeekIntensity, DEFAULT_INTENSITY } from '@/types/progression';
import { WorkoutExerciseTemplate } from '@/components/mesocycles/workout-template-designer';
import {
  applyProgressionStrategyToExercise,
  determineExerciseType,
} from '@/lib/utils/progression-strategy-utils';
import { cn } from '@/lib/utils';
import { TrendingUp, ChevronRight } from 'lucide-react';

interface ProgressionStrategyDemoProps {
  strategy: ProgressionStrategy;
}

export function ProgressionStrategyDemo({
  strategy,
}: ProgressionStrategyDemoProps) {
  // Sample exercises to demonstrate the strategy
  const sampleExercises: WorkoutExerciseTemplate[] = [
    {
      exerciseId: '1',
      exerciseName: 'Barbell Back Squat',
      orderIdx: 0,
      defaults: {
        sets: 3,
        reps: '8',
        rir: 2,
        rest: '180s',
      },
    },
    {
      exerciseId: '2',
      exerciseName: 'Barbell Bicep Curl',
      orderIdx: 1,
      defaults: {
        sets: 3,
        reps: '10-12',
        rir: 2,
        rest: '90s',
      },
    },
  ];

  // Sample week intensities for progression
  const weekIntensities: WeekIntensity[] = [
    { week: 1, intensity: DEFAULT_INTENSITY, isDeload: false },
    {
      week: 3,
      intensity: {
        volume: 110,
        weight: 105,
        rir: 1,
        rpe: 8,
        sets: 1.1,
        repsModifier: 1.1,
      },
      isDeload: false,
    },
    {
      week: 6,
      intensity: {
        volume: 120,
        weight: 110,
        rir: 0,
        rpe: 9,
        sets: 1.2,
        repsModifier: 1.2,
      },
      isDeload: false,
    },
  ];

  const getStrategyDescription = () => {
    switch (strategy.primary) {
      case 'weight':
        return 'Focus on progressively increasing the weight while maintaining the same rep scheme';
      case 'volume':
        return 'Focus on increasing sets and reps while keeping the weight relatively constant';
      case 'intensity':
        return 'Focus on training closer to failure (lower RIR) while maintaining volume';
      case 'density':
        return 'Focus on doing the same work in less time by reducing rest periods';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Strategy Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {getStrategyDescription()}
        </div>

        {sampleExercises.map((exercise, exerciseIdx) => {
          const exerciseType = determineExerciseType(
            exercise.exerciseName || '',
          );

          return (
            <div key={exercise.exerciseId} className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{exercise.exerciseName}</h4>
                <Badge variant="outline" className="text-xs">
                  {exerciseType}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                {weekIntensities.map((weekIntensity, idx) => {
                  const modified = applyProgressionStrategyToExercise(
                    exercise,
                    weekIntensity,
                    strategy,
                    exerciseType,
                  );

                  return (
                    <div key={weekIntensity.week} className="space-y-1">
                      <div className="font-medium text-xs text-muted-foreground">
                        Week {weekIntensity.week}
                      </div>
                      <div
                        className={cn(
                          'p-2 rounded-md border',
                          idx === 0 && 'bg-muted/30',
                          idx === 1 && 'bg-primary/5 border-primary/20',
                          idx === 2 && 'bg-primary/10 border-primary/40',
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              Sets×Reps:
                            </span>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                modified.sets !== exercise.defaults.sets ||
                                  modified.reps !== exercise.defaults.reps
                                  ? 'text-primary'
                                  : '',
                              )}
                            >
                              {modified.sets} × {modified.reps}
                            </span>
                          </div>

                          {modified.weight && modified.weight !== 100 && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Weight:
                              </span>
                              <span className="text-xs font-medium text-primary">
                                {modified.weight}%
                              </span>
                            </div>
                          )}

                          {modified.rir !== undefined && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                RIR:
                              </span>
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  modified.rir !== exercise.defaults.rir
                                    ? 'text-primary'
                                    : '',
                                )}
                              >
                                {modified.rir}
                              </span>
                            </div>
                          )}

                          {modified.rest && strategy.primary === 'density' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                Rest:
                              </span>
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  modified.rest !== exercise.defaults.rest
                                    ? 'text-primary'
                                    : '',
                                )}
                              >
                                {modified.rest}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {exerciseIdx === 0 && weekIntensities.length > 1 && (
                <div className="flex items-center justify-center text-xs text-muted-foreground">
                  <ChevronRight className="h-3 w-3" />
                  <span className="mx-1">Progresses over time</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}

        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">
            This preview shows how your workouts will change throughout the
            mesocycle based on your selected strategy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
