'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Check, RotateCcw } from 'lucide-react';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import { BARBELL_WEIGHTS, BARBELL_WEIGHTS_LBS } from '@/constants/exercises';

interface LoggedSet {
  set_number: number;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  is_myo_rep?: boolean;
  is_partial?: boolean;
  myo_rep_count?: number;
  partial_count?: number;
}

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscle: string;
}

interface SetLoggerProps {
  previousSets: LoggedSet[];
  defaults?: {
    sets?: number;
    reps?: string;
    rir?: number;
    rpe?: number;
    rest?: string;
  };
  exercise: Exercise;
  onLogSet: (set: LoggedSet) => void;
}

export function SetLogger({
  previousSets,
  defaults,
  exercise,
  onLogSet,
}: SetLoggerProps) {
  const { weightUnit, convertWeight } = useUserPreferences();
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rir, setRir] = useState<number | undefined>(
    defaults?.rir ??
      (defaults?.rpe !== undefined ? 10 - defaults.rpe : undefined),
  );
  const [isMyoRep, setIsMyoRep] = useState(false);
  const [myoRepCount, setMyoRepCount] = useState(0);
  const [isPartial, setIsPartial] = useState(false);
  const [partialCount, setPartialCount] = useState(0);
  const [intensityType, setIntensityType] = useState<'rir' | 'rpe'>(
    defaults?.rpe !== undefined ? 'rpe' : 'rir',
  );
  const [selectedBarbellType, setSelectedBarbellType] = useState<string>('');

  // Get the last set's data for quick re-use
  const lastSet = previousSets[previousSets.length - 1];
  const currentSetNumber = previousSets.length + 1;

  // Check if this is a barbell exercise
  const isBarbellExercise = exercise.type === 'barbell';

  // Get barbell weights based on user's unit preference
  const barbellWeights =
    weightUnit === 'lbs' ? BARBELL_WEIGHTS_LBS : BARBELL_WEIGHTS;

  useEffect(() => {
    if (previousSets.length === 0 && defaults?.reps && !reps) {
      const first = parseInt(defaults.reps.split('-')[0]);
      if (!isNaN(first)) {
        setReps(first.toString());
      }
    }
  }, [previousSets.length, defaults, reps]);

  logger.log('SetLogger Debug:', {
    exerciseName: exercise.name,
    exerciseType: exercise.type,
    isBarbellExercise,
    weightUnit,
    barbellWeights,
    selectedBarbellType,
  });

  const handleSubmit = () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);

    if (isNaN(weightNum) || isNaN(repsNum)) {
      return;
    }

    // Calculate total weight including barbell if selected
    let totalWeight = weightNum;
    if (
      isBarbellExercise &&
      selectedBarbellType &&
      selectedBarbellType !== 'none'
    ) {
      const barbellWeight =
        barbellWeights[selectedBarbellType as keyof typeof barbellWeights];
      // Double the plate weight since plates go on both sides of the bar
      const totalPlateWeight = weightNum * 2;
      totalWeight = totalPlateWeight + barbellWeight;
      logger.log('Adding barbell weight with plate doubling:', {
        plateWeightPerSide: weightNum,
        totalPlateWeight,
        barbellWeight,
        totalWeight,
        barbellType: selectedBarbellType,
      });
    }

    // Convert from user's unit to kg for storage
    const weightInKg =
      weightUnit === 'lbs' ? totalWeight / 2.20462 : totalWeight;

    const newSet: LoggedSet = {
      set_number: currentSetNumber,
      weight: weightInKg,
      reps: repsNum,
      is_myo_rep: isMyoRep,
      is_partial: isPartial,
      ...(isMyoRep ? { myo_rep_count: myoRepCount } : {}),
      ...(isPartial ? { partial_count: partialCount } : {}),
    };

    if (intensityType === 'rir' && rir !== undefined) {
      newSet.rir = rir;
    } else if (intensityType === 'rpe' && rir !== undefined) {
      newSet.rpe = 10 - rir; // Convert RIR to RPE
    }

    logger.log('Logging set:', newSet);
    onLogSet(newSet);

    // Reset form but keep weight and barbell selection for next set
    setReps('');
    setIsMyoRep(false);
    setMyoRepCount(0);
    setIsPartial(false);
    setPartialCount(0);
  };

  const handleQuickWeight = (adjustment: number) => {
    const currentWeight = parseFloat(weight) || 0;
    setWeight((currentWeight + adjustment).toString());
  };

  const handleQuickReps = (value: number) => {
    setReps(value.toString());
  };

  const handleRepeatLastSet = () => {
    if (lastSet) {
      const totalWeightInUserUnit = convertWeight(lastSet.weight);

      // If this is a barbell exercise and we have a selected barbell type,
      // subtract the barbell weight and divide by 2 to show plate weight per side
      if (
        isBarbellExercise &&
        selectedBarbellType &&
        selectedBarbellType !== 'none'
      ) {
        const barbellWeight =
          barbellWeights[selectedBarbellType as keyof typeof barbellWeights];
        const totalPlateWeight = Math.max(
          0,
          totalWeightInUserUnit - barbellWeight,
        );
        const plateWeightPerSide = totalPlateWeight / 2;
        setWeight(plateWeightPerSide.toString());
        logger.log(
          'Repeating set with barbell separation and plate doubling:',
          {
            totalWeight: totalWeightInUserUnit,
            barbellWeight,
            totalPlateWeight,
            plateWeightPerSide,
            barbellType: selectedBarbellType,
          },
        );
      } else {
        setWeight(totalWeightInUserUnit.toString());
      }

      setReps(lastSet.reps.toString());
      if (lastSet.rir !== undefined) setRir(lastSet.rir);
    }
  };

  return (
    <div className="space-y-4">
      {/* Previous Sets */}
      {previousSets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Previous Sets</Label>
          {isBarbellExercise && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              💡 Weights shown include total weight used (plates on both sides +
              barbell if applicable)
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 text-sm">
            {previousSets.map((set, idx) => (
              <Card key={idx} className="p-2">
                <div className="text-center">
                  <div className="font-semibold">Set {set.set_number}</div>
                  <div className="text-muted-foreground">
                    {convertWeight(set.weight)}
                    {weightUnit} × {set.reps}
                    {typeof set.rir === 'number'
                      ? ` @${set.rir}RIR`
                      : typeof set.rpe === 'number'
                        ? ` @${set.rpe}RPE`
                        : ''}
                  </div>
                  <div className="flex gap-1 justify-center mt-1">
                    {set.is_myo_rep && (
                      <Badge variant="secondary" className="text-xs">
                        Myo
                      </Badge>
                    )}
                    {set.is_partial && (
                      <Badge variant="secondary" className="text-xs">
                        Partial
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Current Set Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold">
                Set {currentSetNumber}
                {defaults?.sets ? ` of ${defaults.sets}` : ''}
              </h3>
              {lastSet && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRepeatLastSet}
                  className="mt-1"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Repeat Last Set
                </Button>
              )}
            </div>

            {/* Barbell Type Selector - only show for barbell exercises */}
            {isBarbellExercise && (
              <div className="space-y-3">
                <Label>Barbell / Bar Type</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant={
                      selectedBarbellType === 'none' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSelectedBarbellType('none')}
                    className="justify-start h-auto py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedBarbellType === 'none' ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                      >
                        {selectedBarbellType === 'none' && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <span className="font-medium">Plates Only</span>
                    </div>
                  </Button>
                  {Object.entries(barbellWeights).map(([type, weight]) => (
                    <Button
                      key={type}
                      variant={
                        selectedBarbellType === type ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setSelectedBarbellType(type)}
                      className="justify-start h-auto py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedBarbellType === type ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                        >
                          {selectedBarbellType === type && (
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{type}</div>
                          <div className="text-xs text-muted-foreground">
                            {weight} {weightUnit}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                {selectedBarbellType && selectedBarbellType !== 'none' && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <strong>Total weight will include:</strong>{' '}
                    {
                      barbellWeights[
                        selectedBarbellType as keyof typeof barbellWeights
                      ]
                    }{' '}
                    {weightUnit} ({selectedBarbellType}) + plates on both sides
                    (entered weight × 2)
                  </div>
                )}
              </div>
            )}

            {/* Weight Input */}
            <div className="space-y-2">
              <Label>
                {isBarbellExercise &&
                selectedBarbellType &&
                selectedBarbellType !== 'none'
                  ? `Plate Weight Per Side (${weightUnit})`
                  : `Weight (${weightUnit})`}
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuickWeight(-2.5)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="text-center text-lg font-semibold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuickWeight(2.5)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                {[2.5, 5, 10, 20].map((w) => (
                  <Button
                    key={w}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleQuickWeight(w)}
                  >
                    +{w}
                  </Button>
                ))}
              </div>
            </div>

            {/* Reps Input */}
            <div className="space-y-2">
              <Label>Reps</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setReps((parseInt(reps) || 0) - 1 + '')}
                  disabled={!reps || parseInt(reps) <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="0"
                  className="text-center text-lg font-semibold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setReps((parseInt(reps) || 0) + 1 + '')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[5, 8, 10, 12, 15].map((r) => (
                  <Button
                    key={r}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReps(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            {/* Intensity (RIR/RPE) */}
            <div className="space-y-2">
              <Tabs
                value={intensityType}
                onValueChange={(v) => setIntensityType(v as 'rir' | 'rpe')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rir">RIR</TabsTrigger>
                  <TabsTrigger value="rpe">RPE</TabsTrigger>
                </TabsList>
                <TabsContent value="rir" className="space-y-2">
                  <Label>Reps in Reserve</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((r) => (
                      <Button
                        key={r}
                        variant={rir === r ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRir(r)}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="rpe" className="space-y-2">
                  <Label>Rate of Perceived Exertion</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[6, 7, 8, 9, 10].map((r) => (
                      <Button
                        key={r}
                        variant={rir === 10 - r ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRir(10 - r)}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Set Modifiers */}
            <div className="flex gap-2">
              <Button
                variant={isMyoRep ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setIsMyoRep(!isMyoRep)}
              >
                Myo-Rep
              </Button>
              <Button
                variant={isPartial ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setIsPartial(!isPartial)}
              >
                Partial
              </Button>
            </div>

            {isMyoRep && (
              <div className="space-y-2">
                <Label>Myo-Rep Count</Label>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMyoRepCount((c) => Math.max(0, c - 1))}
                    disabled={myoRepCount === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={myoRepCount}
                    onChange={(e) => setMyoRepCount(Number(e.target.value))}
                    className="text-center w-20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMyoRepCount((c) => c + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {isPartial && (
              <div className="space-y-2">
                <Label>Partial Count</Label>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPartialCount((c) => Math.max(0, c - 1))}
                    disabled={partialCount === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={partialCount}
                    onChange={(e) => setPartialCount(Number(e.target.value))}
                    className="text-center w-20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPartialCount((c) => c + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Total Weight Display */}
            {isBarbellExercise &&
              selectedBarbellType &&
              selectedBarbellType !== 'none' &&
              weight && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      Total Weight
                    </div>
                    <div className="text-xl font-bold">
                      {(
                        parseFloat(weight) * 2 +
                        barbellWeights[
                          selectedBarbellType as keyof typeof barbellWeights
                        ]
                      ).toFixed(1)}{' '}
                      {weightUnit}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {weight} {weightUnit} × 2 sides +{' '}
                      {
                        barbellWeights[
                          selectedBarbellType as keyof typeof barbellWeights
                        ]
                      }{' '}
                      {weightUnit} ({selectedBarbellType})
                    </div>
                  </div>
                </div>
              )}

            {/* Log Set Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!weight || !reps}
            >
              <Check className="mr-2 h-4 w-4" />
              Log Set
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
