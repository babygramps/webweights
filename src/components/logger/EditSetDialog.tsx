'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MinusCircle, PlusCircle, Dumbbell, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface UpdatedSet {
  id: string;
  weight: number;
  reps: number;
  rir: number | null;
  rpe: number | null;
  isMyoRep: boolean;
  isPartial: boolean;
  myoRepCount: number;
  partialCount: number;
}

interface EditSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  set: {
    id: string;
    weight: number;
    reps: number;
    rir?: number;
    rpe?: number;
    isMyoRep?: boolean;
    isPartial?: boolean;
    myoRepCount?: number;
    partialCount?: number;
  };
  onSave: (updatedSet: UpdatedSet) => void;
}

export function EditSetDialog({
  open,
  onOpenChange,
  set,
  onSave,
}: EditSetDialogProps) {
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [rir, setRir] = useState(set.rir?.toString() || '');
  const [rpe, setRpe] = useState(set.rpe?.toString() || '');
  const [isMyoRep, setIsMyoRep] = useState(set.isMyoRep || false);
  const [isPartial, setIsPartial] = useState(set.isPartial || false);
  const [myoRepCount, setMyoRepCount] = useState(set.myoRepCount || 0);
  const [partialCount, setPartialCount] = useState(set.partialCount || 0);

  console.log(`[EditSetDialog] Editing set ${set.id}`);

  const handleSave = () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);

    if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
      toast.error('Please enter valid weight and reps');
      return;
    }

    const updatedSet: UpdatedSet = {
      id: set.id,
      weight: weightNum,
      reps: repsNum,
      rir: rir ? parseInt(rir) : null,
      rpe: rpe ? parseInt(rpe) : null,
      isMyoRep,
      isPartial,
      myoRepCount: isMyoRep ? myoRepCount : 0,
      partialCount: isPartial ? partialCount : 0,
    };

    console.log('[EditSetDialog] Saving updated set:', updatedSet);
    onSave(updatedSet);
    onOpenChange(false);
  };

  const adjustCount = (
    type: 'myo' | 'partial',
    operation: 'increment' | 'decrement',
  ) => {
    if (type === 'myo') {
      setMyoRepCount((prev) => {
        const newValue = operation === 'increment' ? prev + 1 : prev - 1;
        return Math.max(0, newValue);
      });
    } else {
      setPartialCount((prev) => {
        const newValue = operation === 'increment' ? prev + 1 : prev - 1;
        return Math.max(0, newValue);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Set</DialogTitle>
          <DialogDescription>
            Update your set details and intensity techniques
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Weight and Reps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="225"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="8"
              />
            </div>
          </div>

          {/* RIR/RPE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rir">RIR (optional)</Label>
              <Input
                id="rir"
                type="number"
                value={rir}
                onChange={(e) => setRir(e.target.value)}
                placeholder="2"
                min="0"
                max="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpe">RPE (optional)</Label>
              <Input
                id="rpe"
                type="number"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder="8"
                min="1"
                max="10"
              />
            </div>
          </div>

          {/* Myo-Reps Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <Label htmlFor="myo-rep">Myo-Reps</Label>
              </div>
              <Switch
                id="myo-rep"
                checked={isMyoRep}
                onCheckedChange={setIsMyoRep}
              />
            </div>

            {isMyoRep && (
              <div className="flex items-center justify-between pl-6">
                <span className="text-sm text-muted-foreground">
                  Myo-Rep Count
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => adjustCount('myo', 'decrement')}
                    disabled={myoRepCount === 0}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {myoRepCount}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => adjustCount('myo', 'increment')}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Partials Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-4 w-4 text-blue-500" />
                <Label htmlFor="partials">Partials</Label>
              </div>
              <Switch
                id="partials"
                checked={isPartial}
                onCheckedChange={setIsPartial}
              />
            </div>

            {isPartial && (
              <div className="flex items-center justify-between pl-6">
                <span className="text-sm text-muted-foreground">
                  Partial Count
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => adjustCount('partial', 'decrement')}
                    disabled={partialCount === 0}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {partialCount}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => adjustCount('partial', 'increment')}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
