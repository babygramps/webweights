'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Check, RotateCcw } from 'lucide-react';

interface LoggedSet {
  set_number: number;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  is_myo_rep?: boolean;
  is_partial?: boolean;
}

interface SetLoggerProps {
  previousSets: LoggedSet[];
  defaults?: {
    sets?: number;
    reps?: string;
    rir?: number;
    rest?: string;
  };
  onLogSet: (set: LoggedSet) => void;
}

export function SetLogger({
  previousSets,
  defaults,
  onLogSet,
}: SetLoggerProps) {
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rir, setRir] = useState<number | undefined>(defaults?.rir);
  const [isMyoRep, setIsMyoRep] = useState(false);
  const [isPartial, setIsPartial] = useState(false);
  const [intensityType, setIntensityType] = useState<'rir' | 'rpe'>('rir');

  // Get the last set's data for quick re-use
  const lastSet = previousSets[previousSets.length - 1];
  const currentSetNumber = previousSets.length + 1;

  const handleSubmit = () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);

    if (isNaN(weightNum) || isNaN(repsNum)) {
      return;
    }

    const newSet: LoggedSet = {
      set_number: currentSetNumber,
      weight: weightNum,
      reps: repsNum,
      is_myo_rep: isMyoRep,
      is_partial: isPartial,
    };

    if (intensityType === 'rir' && rir !== undefined) {
      newSet.rir = rir;
    } else if (intensityType === 'rpe' && rir !== undefined) {
      newSet.rpe = 10 - rir; // Convert RIR to RPE
    }

    console.log('Logging set:', newSet);
    onLogSet(newSet);

    // Reset form but keep weight for next set
    setReps('');
    setIsMyoRep(false);
    setIsPartial(false);
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
      setWeight(lastSet.weight.toString());
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
          <div className="grid grid-cols-4 gap-2 text-sm">
            {previousSets.map((set, idx) => (
              <Card key={idx} className="p-2">
                <div className="text-center">
                  <div className="font-semibold">Set {set.set_number}</div>
                  <div className="text-muted-foreground">
                    {set.weight}kg × {set.reps}
                    {set.rir !== undefined && ` @${set.rir}RIR`}
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
              <h3 className="font-semibold">Set {currentSetNumber}</h3>
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

            {/* Weight Input */}
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
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
