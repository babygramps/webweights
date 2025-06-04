'use client';
import logger from '@/lib/logger';

import { Button } from '@/components/ui/button';
import {
  useUserPreferences,
  WeightUnit,
} from '@/lib/contexts/UserPreferencesContext';
import { toast } from 'sonner';

export function UnitToggle() {
  const { weightUnit, updateWeightUnit, loading } = useUserPreferences();

  const handleToggle = async () => {
    const newUnit: WeightUnit = weightUnit === 'kg' ? 'lbs' : 'kg';

    try {
      await updateWeightUnit(newUnit);
      toast.success(`Units changed to ${newUnit}`);
    } catch (error) {
      toast.error('Failed to update units');
      logger.error('Error updating units:', error);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        {weightUnit.toUpperCase()}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="font-mono"
    >
      {weightUnit.toUpperCase()}
    </Button>
  );
}
