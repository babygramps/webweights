'use client';
import logger from '@/lib/logger';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ProgressionStrategy,
  DEFAULT_STRATEGIES,
} from '@/types/progression-strategy';
import { ProgressionStrategyDemo } from './progression-strategy-demo';

interface ProgressionStrategySelectorProps {
  onStrategyChange: (strategy: ProgressionStrategy) => void;
  currentStrategy?: ProgressionStrategy;
  showDemo?: boolean; // Optional prop to show/hide demo
}

export function ProgressionStrategySelector({
  onStrategyChange,
  currentStrategy,
  showDemo = false,
}: ProgressionStrategySelectorProps) {
  const [strategy, setStrategy] = useState<ProgressionStrategy>(
    currentStrategy || DEFAULT_STRATEGIES.hypertrophy,
  );

  const handlePrimaryChange = (value: string) => {
    logger.log('Progression strategy changed to:', value);
    const newStrategy: ProgressionStrategy = {
      ...strategy,
      primary: value as ProgressionStrategy['primary'],
    };

    // Apply default adjustments based on primary strategy
    if (value === 'weight') {
      newStrategy.secondaryAdjustments =
        DEFAULT_STRATEGIES.strength.secondaryAdjustments;
      newStrategy.constraints = DEFAULT_STRATEGIES.strength.constraints;
    } else if (value === 'volume') {
      newStrategy.secondaryAdjustments =
        DEFAULT_STRATEGIES.hypertrophy.secondaryAdjustments;
      newStrategy.constraints = DEFAULT_STRATEGIES.hypertrophy.constraints;
    } else if (value === 'intensity') {
      newStrategy.secondaryAdjustments =
        DEFAULT_STRATEGIES.peaking.secondaryAdjustments;
      newStrategy.constraints = DEFAULT_STRATEGIES.peaking.constraints;
    } else if (value === 'density') {
      newStrategy.secondaryAdjustments =
        DEFAULT_STRATEGIES.conditioning.secondaryAdjustments;
      newStrategy.constraints = DEFAULT_STRATEGIES.conditioning.constraints;
    }

    setStrategy(newStrategy);
    onStrategyChange(newStrategy);
  };

  const handleSecondaryChange = (
    key: keyof ProgressionStrategy['secondaryAdjustments'],
    checked: boolean,
  ) => {
    const newStrategy: ProgressionStrategy = {
      ...strategy,
      secondaryAdjustments: {
        ...strategy.secondaryAdjustments,
        [key]: checked,
      },
    };
    logger.log('Secondary adjustment changed:', key, checked);
    setStrategy(newStrategy);
    onStrategyChange(newStrategy);
  };

  const handleConstraintChange = (
    key: keyof ProgressionStrategy['constraints'],
    checked: boolean,
  ) => {
    const newStrategy: ProgressionStrategy = {
      ...strategy,
      constraints: {
        ...strategy.constraints,
        [key]: checked,
      },
    };
    logger.log('Constraint changed:', key, checked);
    setStrategy(newStrategy);
    onStrategyChange(newStrategy);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progression Strategy</CardTitle>
          <CardDescription>
            Choose how you want to progress throughout the mesocycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={strategy.primary}
            onValueChange={handlePrimaryChange}
          >
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="weight" id="weight" className="mt-1" />
                <Label htmlFor="weight" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Weight Progression</p>
                    <p className="text-sm text-muted-foreground">
                      Keep reps constant, increase weight over time (Strength
                      focus)
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="volume" id="volume" className="mt-1" />
                <Label htmlFor="volume" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Volume Progression</p>
                    <p className="text-sm text-muted-foreground">
                      Increase sets/reps while maintaining weight (Hypertrophy
                      focus)
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem
                  value="intensity"
                  id="intensity"
                  className="mt-1"
                />
                <Label htmlFor="intensity" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Intensity Progression</p>
                    <p className="text-sm text-muted-foreground">
                      Decrease RIR/Increase RPE while maintaining volume
                      (Peaking focus)
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="density" id="density" className="mt-1" />
                <Label htmlFor="density" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium">Density Progression</p>
                    <p className="text-sm text-muted-foreground">
                      Maintain work, decrease rest times (Conditioning focus)
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Secondary adjustments */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Secondary Adjustments
            </Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-sets"
                  checked={strategy.secondaryAdjustments.sets}
                  onCheckedChange={(checked) =>
                    handleSecondaryChange('sets', checked as boolean)
                  }
                />
                <Label
                  htmlFor="adjust-sets"
                  className="text-sm font-normal cursor-pointer"
                >
                  Allow set adjustments
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-reps"
                  checked={strategy.secondaryAdjustments.reps}
                  onCheckedChange={(checked) =>
                    handleSecondaryChange('reps', checked as boolean)
                  }
                />
                <Label
                  htmlFor="adjust-reps"
                  className="text-sm font-normal cursor-pointer"
                >
                  Allow rep adjustments
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-rir"
                  checked={strategy.secondaryAdjustments.rir}
                  onCheckedChange={(checked) =>
                    handleSecondaryChange('rir', checked as boolean)
                  }
                />
                <Label
                  htmlFor="adjust-rir"
                  className="text-sm font-normal cursor-pointer"
                >
                  Allow RIR adjustments
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjust-rest"
                  checked={strategy.secondaryAdjustments.rest}
                  onCheckedChange={(checked) =>
                    handleSecondaryChange('rest', checked as boolean)
                  }
                />
                <Label
                  htmlFor="adjust-rest"
                  className="text-sm font-normal cursor-pointer"
                >
                  Allow rest time adjustments
                </Label>
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Constraints</Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maintain-reps"
                  checked={strategy.constraints.maintainReps || false}
                  onCheckedChange={(checked) =>
                    handleConstraintChange('maintainReps', checked as boolean)
                  }
                />
                <Label
                  htmlFor="maintain-reps"
                  className="text-sm font-normal cursor-pointer"
                >
                  Keep reps constant throughout
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maintain-sets"
                  checked={strategy.constraints.maintainSets || false}
                  onCheckedChange={(checked) =>
                    handleConstraintChange('maintainSets', checked as boolean)
                  }
                />
                <Label
                  htmlFor="maintain-sets"
                  className="text-sm font-normal cursor-pointer"
                >
                  Keep sets constant throughout
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maintain-rir"
                  checked={strategy.constraints.maintainRIR || false}
                  onCheckedChange={(checked) =>
                    handleConstraintChange('maintainRIR', checked as boolean)
                  }
                />
                <Label
                  htmlFor="maintain-rir"
                  className="text-sm font-normal cursor-pointer"
                >
                  Keep RIR constant throughout
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDemo && <ProgressionStrategyDemo strategy={strategy} />}
    </div>
  );
}
