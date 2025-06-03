'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical, Copy } from 'lucide-react';
import { ExerciseSelector } from '@/components/logger/exercise-selector';
import { cn } from '@/lib/utils';

export interface WorkoutExerciseTemplate {
  exerciseId: string;
  exerciseName?: string;
  orderIdx: number;
  defaults: {
    sets: number;
    reps: string;
    rir?: number;
    rpe?: number;
    rest: string;
  };
}

export interface WorkoutTemplate {
  id: string;
  label: string;
  dayOfWeek: number[]; // 0 = Sunday, 6 = Saturday
  exercises: WorkoutExerciseTemplate[];
}

interface WorkoutTemplateDesignerProps {
  templates: WorkoutTemplate[];
  onTemplatesChange: Dispatch<SetStateAction<WorkoutTemplate[]>>;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface SortableExerciseItemProps {
  exercise: WorkoutExerciseTemplate;
  templateId: string;
  exerciseIndex: number;
  updateExercise: (
    templateId: string,
    exerciseIndex: number,
    updates: Partial<WorkoutExerciseTemplate>,
  ) => void;
  removeExercise: (templateId: string, exerciseIndex: number) => void;
}

function SortableExerciseItem({
  exercise,
  templateId,
  exerciseIndex,
  removeExercise,
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.exerciseId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 bg-background rounded-md border',
        isDragging && 'opacity-50 cursor-grabbing',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary"
        aria-label="Drag handle"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <div className="font-medium">{exercise.exerciseName}</div>
        <div className="text-sm text-muted-foreground">
          {exercise.defaults.sets} sets × {exercise.defaults.reps} reps
          {exercise.defaults.rir !== undefined &&
            ` @ RIR ${exercise.defaults.rir}`}
          {exercise.defaults.rpe !== undefined &&
            ` @ RPE ${exercise.defaults.rpe}`}
          {exercise.defaults.rest && ` | Rest: ${exercise.defaults.rest}`}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeExercise(templateId, exerciseIndex)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function WorkoutTemplateDesigner({
  templates,
  onTemplatesChange,
}: WorkoutTemplateDesignerProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState<
    string | null
  >(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent, templateId: string) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    onTemplatesChange((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const oldIndex = t.exercises.findIndex(
          (ex) => ex.exerciseId === active.id,
        );
        const newIndex = t.exercises.findIndex(
          (ex) => ex.exerciseId === over.id,
        );
        if (oldIndex === -1 || newIndex === -1) return t;
        return {
          ...t,
          exercises: arrayMove(t.exercises, oldIndex, newIndex).map(
            (ex, idx) => ({
              ...ex,
              orderIdx: idx,
            }),
          ),
        };
      }),
    );
  };

  console.log(
    '[WorkoutTemplateDesigner] Rendering with',
    templates.length,
    'templates',
  );

  const addWorkoutTemplate = () => {
    const newTemplate: WorkoutTemplate = {
      id: crypto.randomUUID(),
      label: `Workout ${templates.length + 1}`,
      dayOfWeek: [],
      exercises: [],
    };
    console.log('[WorkoutTemplateDesigner] Adding new template:', newTemplate);
    onTemplatesChange((prev) => [...prev, newTemplate]);
  };

  const updateTemplate = (
    templateId: string,
    updates: Partial<WorkoutTemplate>,
  ) => {
    console.log(
      '[WorkoutTemplateDesigner] Updating template:',
      templateId,
      updates,
    );
    onTemplatesChange((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, ...updates } : t)),
    );
  };

  const deleteTemplate = (templateId: string) => {
    console.log('[WorkoutTemplateDesigner] Deleting template:', templateId);
    onTemplatesChange((prev) => prev.filter((t) => t.id !== templateId));
  };

  const duplicateTemplate = (template: WorkoutTemplate) => {
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: crypto.randomUUID(),
      label: `${template.label} (Copy)`,
    };
    console.log('[WorkoutTemplateDesigner] Duplicating template:', newTemplate);
    onTemplatesChange((prev) => [...prev, newTemplate]);
  };

  const addExercisesToTemplate = (
    templateId: string,
    exercisesToAdd: Array<{ id: string; name: string }>,
  ) => {
    onTemplatesChange((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const startIndex = t.exercises.length;
        const newExercises = exercisesToAdd.map((ex, idx) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          orderIdx: startIndex + idx,
          defaults: {
            sets: 3,
            reps: '8-12',
            rir: 2,
            rest: '2:00',
          },
        }));
        return { ...t, exercises: [...t.exercises, ...newExercises] };
      }),
    );
    setShowExerciseSelector(null);
  };

  const removeExercise = (templateId: string, exerciseIndex: number) => {
    console.log(
      '[WorkoutTemplateDesigner] Removing exercise:',
      templateId,
      exerciseIndex,
    );
    onTemplatesChange((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const updatedExercises = t.exercises.filter(
          (_, i) => i !== exerciseIndex,
        );
        updatedExercises.forEach((ex, i) => {
          ex.orderIdx = i;
        });
        return { ...t, exercises: updatedExercises };
      }),
    );
  };

  const toggleDayOfWeek = (templateId: string, day: number) => {
    console.log(
      '[WorkoutTemplateDesigner] Toggling day for template:',
      templateId,
      day,
    );
    onTemplatesChange((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const updatedDays = t.dayOfWeek.includes(day)
          ? t.dayOfWeek.filter((d) => d !== day)
          : [...t.dayOfWeek, day].sort();
        return { ...t, dayOfWeek: updatedDays };
      }),
    );
  };

  const updateExercise = (
    templateId: string,
    exerciseIndex: number,
    updates: Partial<WorkoutExerciseTemplate>,
  ) => {
    console.log(
      '[WorkoutTemplateDesigner] Updating exercise:',
      templateId,
      exerciseIndex,
      updates,
    );
    onTemplatesChange((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const updatedExercises = [...t.exercises];
        updatedExercises[exerciseIndex] = {
          ...updatedExercises[exerciseIndex],
          ...updates,
        };
        return { ...t, exercises: updatedExercises };
      }),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workout Schedule</h3>
        <Button onClick={addWorkoutTemplate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Workout
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Input
                  value={template.label}
                  onChange={(e) =>
                    updateTemplate(template.id, { label: e.target.value })
                  }
                  className="h-7 w-[200px]"
                />
                <div className="flex-1 flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <Badge
                      key={day.value}
                      variant={
                        template.dayOfWeek.includes(day.value)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => toggleDayOfWeek(template.id, day.value)}
                    >
                      {day.label.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, template.id)}
              >
                <SortableContext
                  items={template.exercises.map((ex) => ex.exerciseId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {template.exercises.map((exercise, idx) => (
                      <SortableExerciseItem
                        key={exercise.exerciseId}
                        exercise={exercise}
                        templateId={template.id}
                        exerciseIndex={idx}
                        updateExercise={updateExercise}
                        removeExercise={removeExercise}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowExerciseSelector(template.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Exercise
              </Button>

              {showExerciseSelector === template.id && (
                <ExerciseSelector
                  multiSelect
                  onSelect={(exerciseIds, exerciseNames) =>
                    addExercisesToTemplate(
                      template.id,
                      exerciseIds.map((id, idx) => ({
                        id,
                        name: exerciseNames?.[idx] || 'Exercise',
                      })),
                    )
                  }
                  onClose={() => setShowExerciseSelector(null)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
