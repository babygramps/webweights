'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import {
  EQUIPMENT_TYPES,
  MUSCLE_GROUPS,
  COMMON_TAGS,
} from '@/constants/exercises';

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscle: string;
  tags: string[];
}

interface ExerciseSelectorProps {
  onSelect: (exerciseIds: string[], exerciseNames?: string[]) => void;
  onClose: () => void;
  multiSelect?: boolean;
}

export function ExerciseSelector({
  onSelect,
  onClose,
  multiSelect = false,
}: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_public', true)
        .order('name');
      if (error) throw error;
      setExercises(data || []);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = exercises.filter((ex) => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (typeFilter && ex.type !== typeFilter) {
      return false;
    }
    if (muscleFilter && ex.primary_muscle !== muscleFilter) {
      return false;
    }
    if (tagFilter && !ex.tags?.includes(tagFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg mx-auto relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Select Exercise</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <Select
              value={typeFilter || 'all'}
              onValueChange={(v) => setTypeFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                {EQUIPMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={muscleFilter || 'all'}
              onValueChange={(v) => setMuscleFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Muscle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Muscles</SelectItem>
                {MUSCLE_GROUPS.map((muscle) => (
                  <SelectItem
                    key={muscle}
                    value={muscle}
                    className="capitalize"
                  >
                    {muscle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={tagFilter || 'all'}
              onValueChange={(v) => setTagFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {COMMON_TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag} className="capitalize">
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No exercises found
              </div>
            ) : (
              filtered.map((ex) => (
                <Button
                  key={ex.id}
                  variant="ghost"
                  className="w-full flex justify-between items-center py-3 px-2"
                  onClick={() => {
                    if (multiSelect) {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(ex.id)) {
                          next.delete(ex.id);
                        } else {
                          next.add(ex.id);
                        }
                        return next;
                      });
                    } else {
                      onSelect([ex.id], [ex.name]);
                    }
                  }}
                >
                  <span className="font-medium text-left flex-1">
                    {ex.name}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize mr-2">
                    {ex.primary_muscle} • {ex.type}
                  </span>
                  {multiSelect && (
                    <input
                      type="checkbox"
                      readOnly
                      className="h-4 w-4"
                      checked={selected.has(ex.id)}
                    />
                  )}
                </Button>
              ))
            )}
          </div>
          {multiSelect && (
            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => {
                  const ids = Array.from(selected);
                  const names = exercises
                    .filter((ex) => ids.includes(ex.id))
                    .map((ex) => ex.name);
                  onSelect(ids, names);
                }}
                disabled={selected.size === 0}
              >
                Add Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
