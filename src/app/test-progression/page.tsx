'use client';

import { useState, useCallback } from 'react';
import { ProgressiveIntensityDesigner } from '@/components/mesocycles/progressive-intensity-designer';
import { MesocycleProgression } from '@/types/progression';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestProgressionPage() {
  const [progression, setProgression] = useState<MesocycleProgression | null>(
    null,
  );

  const handleProgressionChange = useCallback(
    (newProgression: MesocycleProgression) => {
      setProgression(newProgression);
      console.log('Progression updated:', newProgression);
    },
    [],
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Progressive Intensity System Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This page demonstrates the progressive intensity management system
            for mesocycles. Use the designer below to create intensity
            progressions with different templates, configure weekly parameters,
            and visualize the progression over time.
          </p>
        </CardContent>
      </Card>

      <ProgressiveIntensityDesigner
        mesocycleWeeks={8}
        initialProgression={progression || undefined}
        onProgressionChange={handleProgressionChange}
      />

      {progression && (
        <Card>
          <CardHeader>
            <CardTitle>Current Progression Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(progression, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
