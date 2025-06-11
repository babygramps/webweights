'use client';
import logger from '@/lib/logger';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExerciseCard } from '@/components/catalogue/exercise-card';
import { FilterBar } from '@/components/catalogue/filter-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscle: string;
  tags: string[];
  equipment_detail?: string | null;
}

export default function CataloguePage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    type: null as string | null,
    muscle: null as string | null,
    tag: null as string | null,
    equipmentDetail: null as string | null,
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      logger.log('Fetching exercises from database...');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (error) {
        logger.error('Error fetching exercises:', error);
        throw error;
      }

      logger.log('Fetched exercises:', data);
      setExercises(data || []);
    } catch (err) {
      logger.error('Failed to fetch exercises:', err);
      setError('Failed to load exercises. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Search filter
      if (
        searchTerm &&
        !exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (filters.type && exercise.type !== filters.type) {
        return false;
      }

      // Equipment detail filter (only applicable for machine type)
      if (
        filters.equipmentDetail &&
        exercise.type === 'machine' &&
        exercise.equipment_detail !== filters.equipmentDetail
      ) {
        return false;
      }

      // Muscle filter
      if (filters.muscle && exercise.primary_muscle !== filters.muscle) {
        return false;
      }

      // Tag filter
      if (filters.tag && !exercise.tags?.includes(filters.tag)) {
        return false;
      }

      return true;
    });
  }, [exercises, searchTerm, filters]);

  // Get list of unique equipment_detail values for machine exercises
  const machineDetails = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.type === 'machine' && ex.equipment_detail) {
        set.add(ex.equipment_detail);
      }
    });
    return Array.from(set).sort();
  }, [exercises]);

  const handleTypeChange = (type: string | null) => {
    logger.log('Type filter changed to:', type);
    setFilters((prev) => ({
      ...prev,
      type,
      equipmentDetail: type === 'machine' ? prev.equipmentDetail : null,
    }));
  };

  const handleMuscleChange = (muscle: string | null) => {
    logger.log('Muscle filter changed to:', muscle);
    setFilters((prev) => ({ ...prev, muscle }));
  };

  const handleTagChange = (tag: string | null) => {
    logger.log('Tag filter changed to:', tag);
    setFilters((prev) => ({ ...prev, tag }));
  };

  const handleEquipmentDetailChange = (detail: string | null) => {
    logger.log('Equipment detail filter changed to:', detail);
    setFilters((prev) => ({ ...prev, equipmentDetail: detail }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exercise Catalogue</h1>
        <p className="text-muted-foreground">
          Browse and search through {exercises.length} exercises to build your
          perfect workout.
        </p>
      </div>

      <FilterBar
        onSearchChange={setSearchTerm}
        onTypeChange={handleTypeChange}
        onMuscleChange={handleMuscleChange}
        onTagChange={handleTagChange}
        onEquipmentDetailChange={handleEquipmentDetailChange}
        equipmentDetails={machineDetails}
        onViewChange={setView}
        view={view}
        activeFilters={filters}
      />

      <div className="mt-8">
        {filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="text-muted-foreground">
                No exercises found matching your filters.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    type: null,
                    muscle: null,
                    tag: null,
                    equipmentDetail: null,
                  });
                }}
                className="text-primary hover:underline mt-2"
              >
                Clear all filters
              </button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredExercises.length} exercise
              {filteredExercises.length !== 1 && 's'}
            </p>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    variant="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
