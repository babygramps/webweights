'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Zap, Dumbbell } from 'lucide-react';
import { EditSetDialog } from './EditSetDialog';
import { toast } from 'sonner';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';

interface LoggedSet {
  id: string;
  exerciseId: string;
  exerciseName?: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
  isMyoRep?: boolean;
  isPartial?: boolean;
  myoRepCount?: number;
  partialCount?: number;
}

interface SetUpdates {
  weight?: number;
  reps?: number;
  rir?: number | null;
  rpe?: number | null;
  isMyoRep?: boolean;
  isPartial?: boolean;
  myoRepCount?: number;
  partialCount?: number;
}

interface PlannedSet {
  setNumber: number;
  reps: string;
  rir?: number;
  rpe?: number;
}

interface SetsListProps {
  sets: LoggedSet[];
  plannedSets?: PlannedSet[];
  onSetUpdated?: () => void;
  onSetDeleted?: () => void;
  onUpdateSet?: (setId: string, updates: SetUpdates) => Promise<void>;
  onDeleteSet?: (setId: string) => Promise<void>;
}

export function SetsList({
  sets,
  plannedSets,
  onSetUpdated,
  onSetDeleted,
  onUpdateSet,
  onDeleteSet,
}: SetsListProps) {
  const { weightUnit, convertWeight } = useUserPreferences();
  const [editingSet, setEditingSet] = useState<LoggedSet | null>(null);
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);

  console.log(`[SetsList] Displaying ${sets.length} sets`);

  const handleEditSet = async (updatedSet: {
    id: string;
    weight: number;
    reps: number;
    rir: number | null;
    rpe: number | null;
    isMyoRep: boolean;
    isPartial: boolean;
    myoRepCount: number;
    partialCount: number;
  }) => {
    if (!onUpdateSet) {
      toast.error('Update function not provided');
      return;
    }

    try {
      await onUpdateSet(updatedSet.id, {
        weight: updatedSet.weight,
        reps: updatedSet.reps,
        rir: updatedSet.rir,
        rpe: updatedSet.rpe,
        isMyoRep: updatedSet.isMyoRep,
        isPartial: updatedSet.isPartial,
        myoRepCount: updatedSet.myoRepCount,
        partialCount: updatedSet.partialCount,
      });

      toast.success('Set updated successfully');
      onSetUpdated?.();
    } catch (error) {
      console.error('[SetsList] Error updating set:', error);
      toast.error('Failed to update set');
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!onDeleteSet) {
      toast.error('Delete function not provided');
      return;
    }

    if (!confirm('Are you sure you want to delete this set?')) {
      return;
    }

    setDeletingSetId(setId);
    try {
      await onDeleteSet(setId);
      toast.success('Set deleted successfully');
      onSetDeleted?.();
    } catch (error) {
      console.error('[SetsList] Error deleting set:', error);
      toast.error('Failed to delete set');
    } finally {
      setDeletingSetId(null);
    }
  };

  // Group sets by exercise
  const setsByExercise = sets.reduce(
    (acc, set) => {
      const exerciseKey = set.exerciseName || set.exerciseId;
      if (!acc[exerciseKey]) {
        acc[exerciseKey] = [];
      }
      acc[exerciseKey].push(set);
      return acc;
    },
    {} as Record<string, LoggedSet[]>,
  );

  if (sets.length === 0 && plannedSets && plannedSets.length > 0) {
    return (
      <div className="space-y-2">
        {plannedSets.map((set) => (
          <Card key={set.setNumber}>
            <CardContent className="p-3 flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Set {set.setNumber}
              </span>
              <span className="font-semibold">{set.reps} reps</span>
              {typeof set.rir === 'number' && (
                <span className="text-sm text-muted-foreground">
                  {set.rir} RIR
                </span>
              )}
              {typeof set.rpe === 'number' && (
                <span className="text-sm text-muted-foreground">
                  {set.rpe} RPE
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {Object.entries(setsByExercise).map(([exerciseName, exerciseSets]) => (
          <Card key={exerciseName}>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3">{exerciseName}</h3>
              <div className="space-y-2">
                {exerciseSets.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        Set {set.setNumber}
                      </span>
                      <span className="font-semibold">
                        {convertWeight(set.weight)} {weightUnit} × {set.reps}{' '}
                        reps
                      </span>
                      {(typeof set.rir === 'number' ||
                        typeof set.rpe === 'number') && (
                        <span className="text-sm text-muted-foreground">
                          {typeof set.rir === 'number'
                            ? `${set.rir} RIR`
                            : typeof set.rpe === 'number'
                              ? `${set.rpe} RPE`
                              : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Intensity technique badges */}
                      {set.isMyoRep && (
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="h-3 w-3" />
                          {set.myoRepCount || 0}
                        </Badge>
                      )}
                      {set.isPartial && (
                        <Badge variant="secondary" className="gap-1">
                          <Dumbbell className="h-3 w-3" />
                          {set.partialCount || 0}
                        </Badge>
                      )}

                      {/* Action buttons */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingSet(set)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSet(set.id)}
                        disabled={deletingSetId === set.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingSet && (
        <EditSetDialog
          open={!!editingSet}
          onOpenChange={(open) => !open && setEditingSet(null)}
          set={editingSet}
          onSave={handleEditSet}
        />
      )}
    </>
  );
}
