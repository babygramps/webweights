'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical, Copy } from 'lucide-react';
import { ExerciseSelector } from '@/components/logger/exercise-selector';

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
  onTemplatesChange: (templates: WorkoutTemplate[]) => void;
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

export function WorkoutTemplateDesigner({
  templates,
  onTemplatesChange,
}: WorkoutTemplateDesignerProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState<
    string | null
  >(null);

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
    onTemplatesChange([...templates, newTemplate]);
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
    onTemplatesChange(
      templates.map((t) => (t.id === templateId ? { ...t, ...updates } : t)),
    );
  };

  const deleteTemplate = (templateId: string) => {
    console.log('[WorkoutTemplateDesigner] Deleting template:', templateId);
    onTemplatesChange(templates.filter((t) => t.id !== templateId));
  };

  const duplicateTemplate = (template: WorkoutTemplate) => {
    const newTemplate: WorkoutTemplate = {
      ...template,
      id: crypto.randomUUID(),
      label: `${template.label} (Copy)`,
    };
    console.log('[WorkoutTemplateDesigner] Duplicating template:', newTemplate);
    onTemplatesChange([...templates, newTemplate]);
  };

  const addExerciseToTemplate = (
    templateId: string,
    exerciseId: string,
    exerciseName: string,
    closeModal = true,
  ) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const newExercise: WorkoutExerciseTemplate = {
      exerciseId,
      exerciseName,
      orderIdx: template.exercises.length,
      defaults: {
        sets: 3,
        reps: '8-12',
        rir: 2,
        rest: '2:00',
      },
    };

    console.log(
      '[WorkoutTemplateDesigner] Adding exercise to template:',
      templateId,
      newExercise,
    );
    updateTemplate(templateId, {
      exercises: [...template.exercises, newExercise],
    });
    if (closeModal) {
      setShowExerciseSelector(null);
    }
  };

  const addExercisesToTemplate = (
    templateId: string,
    exercisesToAdd: Array<{ id: string; name: string }>,
  ) => {
    exercisesToAdd.forEach((ex) => {
      addExerciseToTemplate(templateId, ex.id, ex.name, false);
    });
    setShowExerciseSelector(null);
  };

  const addExercisesToTemplate = (
    templateId: string,
    exercisesToAdd: Array<{ id: string; name: string }>,
  ) => {
    exercisesToAdd.forEach((ex) => {
      addExerciseToTemplate(templateId, ex.id, ex.name);
    });
  };

  const updateExercise = (
    templateId: string,
    exerciseIndex: number,
    updates: Partial<WorkoutExerciseTemplate>,
  ) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const updatedExercises = [...template.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      ...updates,
    };

    console.log(
      '[WorkoutTemplateDesigner] Updating exercise:',
      templateId,
      exerciseIndex,
      updates,
    );
    updateTemplate(templateId, { exercises: updatedExercises });
  };

  const removeExercise = (templateId: string, exerciseIndex: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const updatedExercises = template.exercises.filter(
      (_, i) => i !== exerciseIndex,
    );
    // Re-index exercises
    updatedExercises.forEach((ex, i) => {
      ex.orderIdx = i;
    });

    console.log(
      '[WorkoutTemplateDesigner] Removing exercise:',
      templateId,
      exerciseIndex,
    );
    updateTemplate(templateId, { exercises: updatedExercises });
  };

  const toggleDayOfWeek = (templateId: string, day: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const updatedDays = template.dayOfWeek.includes(day)
      ? template.dayOfWeek.filter((d) => d !== day)
      : [...template.dayOfWeek, day].sort();

    console.log(
      '[WorkoutTemplateDesigner] Toggling day for template:',
      templateId,
      day,
    );
    updateTemplate(templateId, { dayOfWeek: updatedDays });
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

      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <p>No workouts added yet.</p>
            <p className="text-sm mt-2">
              Click &quot;Add Workout&quot; to design your training schedule.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      value={template.label}
                      onChange={(e) =>
                        updateTemplate(template.id, { label: e.target.value })
                      }
                      className="font-semibold w-48"
                      placeholder="Workout name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicateTemplate(template)}
                      title="Duplicate workout"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Day Selection */}
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium">Schedule Days</label>
                  <div className="flex flex-wrap gap-2">
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
                        {day.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Exercises */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Exercises</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExerciseSelector(template.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Exercise
                    </Button>
                  </div>

                  {template.exercises.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No exercises added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {template.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 border rounded-lg"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                            <div className="md:col-span-2">
                              <p className="font-medium">
                                {exercise.exerciseName || 'Unknown Exercise'}
                              </p>
                            </div>
                            <Input
                              type="number"
                              value={exercise.defaults.sets}
                              onChange={(e) =>
                                updateExercise(template.id, index, {
                                  defaults: {
                                    ...exercise.defaults,
                                    sets: parseInt(e.target.value) || 3,
                                  },
                                })
                              }
                              className="w-20"
                              placeholder="Sets"
                              min="1"
                            />
                            <Input
                              value={exercise.defaults.reps}
                              onChange={(e) =>
                                updateExercise(template.id, index, {
                                  defaults: {
                                    ...exercise.defaults,
                                    reps: e.target.value,
                                  },
                                })
                              }
                              className="w-24"
                              placeholder="Reps"
                            />
                            <Select
                              value={exercise.defaults.rir?.toString() || ''}
                              onValueChange={(value) =>
                                updateExercise(template.id, index, {
                                  defaults: {
                                    ...exercise.defaults,
                                    rir: parseInt(value),
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="RIR" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0 RIR</SelectItem>
                                <SelectItem value="1">1 RIR</SelectItem>
                                <SelectItem value="2">2 RIR</SelectItem>
                                <SelectItem value="3">3 RIR</SelectItem>
                                <SelectItem value="4">4 RIR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(template.id, index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <ExerciseSelector
          multiSelect
          onSelect={(ids: string[], names?: string[]) => {
            const selections = ids.map((id, i) => ({
              id,
              name: names?.[i] || 'Exercise',
            }));
            addExercisesToTemplate(showExerciseSelector, selections);
          }}
          onClose={() => setShowExerciseSelector(null)}
        />
      )}
    </div>
  );
}
