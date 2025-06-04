'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';

interface PRCardProps {
  exerciseName: string;
  weight: number;
  reps: number;
  date: Date | string;
  isNew?: boolean;
}

export function PRCard({
  exerciseName,
  weight,
  reps,
  date,
  isNew = false,
}: PRCardProps) {
  const { weightUnit, convertWeight } = useUserPreferences();

  console.log(
    `[PRCard] Rendering PR for ${exerciseName}: ${convertWeight(weight)}${weightUnit} x ${reps} reps`,
  );

  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const formattedDate = format(parsedDate, 'PPP');

  return (
    <Card
      className={`transition-all hover:shadow-lg ${isNew ? 'ring-2 ring-primary' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{exerciseName}</CardTitle>
          <Trophy
            className={`h-5 w-5 ${isNew ? 'text-yellow-500' : 'text-muted-foreground'}`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {convertWeight(weight)} {weightUnit}
            </span>
            <span className="text-lg text-muted-foreground">x {reps}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {formattedDate}
          </div>
          {isNew && (
            <div className="flex items-center text-sm text-primary">
              <TrendingUp className="h-4 w-4 mr-1" />
              New Personal Record!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
