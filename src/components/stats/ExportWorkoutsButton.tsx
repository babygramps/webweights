'use client';

import { Button } from '@/components/ui/button';
import logger from '@/lib/logger';
import { downloadCsv } from '@/lib/utils/mesocycle-export-utils';

export function ExportWorkoutsButton() {
  const handleClick = async () => {
    try {
      const res = await fetch('/api/export/workouts');
      if (!res.ok) throw new Error('Request failed');
      const { data } = await res.json();
      downloadCsv(data, 'workouts.csv');
    } catch (error) {
      logger.error('[ExportWorkoutsButton] Failed to export', error);
    }
  };

  return (
    <Button onClick={handleClick} variant="outline" className="w-full h-full">
      Export Workouts CSV
    </Button>
  );
}
