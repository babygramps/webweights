'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscle: string;
}

interface ExerciseSelectorProps {
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
}

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase()),
  );

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
                  onClick={() => onSelect(ex.id)}
                >
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {ex.primary_muscle} • {ex.type}
                  </span>
                </Button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
