'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  EQUIPMENT_TYPES,
  MUSCLE_GROUPS,
  COMMON_TAGS,
} from '@/constants/exercises';

interface FilterBarProps {
  onSearchChange: (search: string) => void;
  onTypeChange: (type: string | null) => void;
  onMuscleChange: (muscle: string | null) => void;
  onTagChange: (tag: string | null) => void;
  onEquipmentDetailChange: (detail: string | null) => void;
  equipmentDetails: string[];
  onViewChange: (view: 'grid' | 'list') => void;
  view: 'grid' | 'list';
  activeFilters: {
    type: string | null;
    muscle: string | null;
    tag: string | null;
    equipmentDetail: string | null;
  };
}

const equipmentTypes = EQUIPMENT_TYPES;
const muscleGroups = MUSCLE_GROUPS;
const commonTags = COMMON_TAGS;

export function FilterBar({
  onSearchChange,
  onTypeChange,
  onMuscleChange,
  onTagChange,
  onEquipmentDetailChange,
  equipmentDetails,
  onViewChange,
  view,
  activeFilters,
}: FilterBarProps) {
  const [search, setSearch] = useState('');
  const hasActiveFilters =
    activeFilters.type ||
    activeFilters.muscle ||
    activeFilters.tag ||
    activeFilters.equipmentDetail;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const clearAllFilters = () => {
    setSearch('');
    onSearchChange('');
    onTypeChange(null);
    onMuscleChange(null);
    onTagChange(null);
    onEquipmentDetailChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={activeFilters.type || 'all'}
          onValueChange={(value: string) =>
            onTypeChange(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Equipment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            {equipmentTypes.map((type) => (
              <SelectItem key={type} value={type} className="capitalize">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activeFilters.muscle || 'all'}
          onValueChange={(value: string) =>
            onMuscleChange(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Muscle Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Muscles</SelectItem>
            {muscleGroups.map((muscle) => (
              <SelectItem key={muscle} value={muscle} className="capitalize">
                {muscle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activeFilters.tag || 'all'}
          onValueChange={(value: string) =>
            onTagChange(value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Exercise Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {commonTags.map((tag) => (
              <SelectItem key={tag} value={tag} className="capitalize">
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Conditional machine equipment detail filter */}
        {activeFilters.type === 'machine' && (
          <Select
            value={activeFilters.equipmentDetail || 'all'}
            onValueChange={(value: string) =>
              onEquipmentDetailChange(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Machine Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Machines</SelectItem>
              {equipmentDetails.map((detail) => (
                <SelectItem key={detail} value={detail} className="capitalize">
                  {detail}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.type && (
            <Badge variant="secondary" className="capitalize">
              <Filter className="h-3 w-3 mr-1" />
              {activeFilters.type}
              <button
                onClick={() => onTypeChange(null)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.muscle && (
            <Badge variant="secondary" className="capitalize">
              <Filter className="h-3 w-3 mr-1" />
              {activeFilters.muscle}
              <button
                onClick={() => onMuscleChange(null)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.tag && (
            <Badge variant="secondary" className="capitalize">
              <Filter className="h-3 w-3 mr-1" />
              {activeFilters.tag}
              <button
                onClick={() => onTagChange(null)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.equipmentDetail && (
            <Badge variant="secondary" className="capitalize">
              <Filter className="h-3 w-3 mr-1" />
              {activeFilters.equipmentDetail}
              <button
                onClick={() => onEquipmentDetailChange(null)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
