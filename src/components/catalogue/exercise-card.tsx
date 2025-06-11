'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Activity, Target } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscle: string;
  tags: string[];
  description?: string | null;
}

interface ExerciseCardProps {
  exercise: Exercise;
  variant?: 'grid' | 'list';
}

const typeIcons = {
  barbell: Dumbbell,
  dumbbell: Dumbbell,
  machine: Activity,
  bodyweight: Target,
};

export function ExerciseCard({
  exercise,
  variant = 'grid',
}: ExerciseCardProps) {
  const Icon = typeIcons[exercise.type as keyof typeof typeIcons] || Dumbbell;

  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggle = () => {
    setIsFlipped((prev) => !prev);
  };

  if (isFlipped) {
    return (
      <Card
        onClick={handleToggle}
        className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-2 capitalize">
              {exercise.name}
            </CardTitle>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {exercise.description || 'No description available.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleToggle}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{exercise.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground capitalize">
                  {exercise.primary_muscle}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground capitalize">
                  {exercise.type}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {exercise.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={handleToggle}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">
            {exercise.name}
          </CardTitle>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {exercise.primary_muscle}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {exercise.type}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {exercise.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
