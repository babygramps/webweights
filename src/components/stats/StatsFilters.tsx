'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

interface StatsFiltersProps {
  onDateRangeChange?: (range: DateRange | undefined) => void;
  onExerciseChange?: (exerciseId: string | undefined) => void;
  onMuscleGroupChange?: (muscle: string | undefined) => void;
  exercises?: Array<{ id: string; name: string }>;
  muscleGroups?: string[];
}

export function StatsFilters({
  onDateRangeChange,
  onExerciseChange,
  onMuscleGroupChange,
  exercises = [],
  muscleGroups = [],
}: StatsFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedExercise, setSelectedExercise] = useState<
    string | undefined
  >();
  const [selectedMuscle, setSelectedMuscle] = useState<string | undefined>();

  console.log('[StatsFilters] Rendering with', exercises.length, 'exercises');

  const handleDateRangeChange = (range: DateRange | undefined) => {
    console.log('[StatsFilters] Date range changed:', range);
    setDateRange(range);
    onDateRangeChange?.(range);
  };

  const handleExerciseChange = (value: string) => {
    console.log('[StatsFilters] Exercise changed:', value);
    const exerciseId = value === 'all' ? undefined : value;
    setSelectedExercise(exerciseId);
    onExerciseChange?.(exerciseId);
  };

  const handleMuscleGroupChange = (value: string) => {
    console.log('[StatsFilters] Muscle group changed:', value);
    const muscle = value === 'all' ? undefined : value;
    setSelectedMuscle(muscle);
    onMuscleGroupChange?.(muscle);
  };

  const handleReset = () => {
    console.log('[StatsFilters] Resetting all filters');
    setDateRange(undefined);
    setSelectedExercise(undefined);
    setSelectedMuscle(undefined);
    onDateRangeChange?.(undefined);
    onExerciseChange?.(undefined);
    onMuscleGroupChange?.(undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[240px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Exercise Filter */}
      {exercises.length > 0 && (
        <Select
          value={selectedExercise || 'all'}
          onValueChange={handleExerciseChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All exercises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All exercises</SelectItem>
            {exercises.map((exercise) => (
              <SelectItem key={exercise.id} value={exercise.id}>
                {exercise.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Muscle Group Filter */}
      {muscleGroups.length > 0 && (
        <Select
          value={selectedMuscle || 'all'}
          onValueChange={handleMuscleGroupChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All muscles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All muscles</SelectItem>
            {muscleGroups.map((muscle) => (
              <SelectItem key={muscle} value={muscle}>
                {muscle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Reset Button */}
      <Button variant="ghost" size="sm" onClick={handleReset}>
        Reset
      </Button>
    </div>
  );
}
