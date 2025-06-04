'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import { useState, useRef } from 'react';

interface RecordData {
  weight: number;
  reps: number;
  date: Date | string;
}

interface PRCardProps {
  exerciseName: string;
  maxWeight: RecordData;
  maxVolume: RecordData;
  maxReps: RecordData;
  isNew?: boolean;
}

export function PRCard({
  exerciseName,
  maxWeight,
  maxVolume,
  maxReps,
  isNew = false,
}: PRCardProps) {
  const { weightUnit, convertWeight } = useUserPreferences();

  const [tab, setTab] = useState<'weight' | 'volume' | 'reps'>('weight');
  const startX = useRef<number | null>(null);

  const records = {
    weight: maxWeight,
    volume: maxVolume,
    reps: maxReps,
  } as const;

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 50) {
      const order = ['weight', 'volume', 'reps'] as const;
      const index = order.indexOf(tab);
      if (delta < 0) {
        setTab(order[(index + 1) % order.length]);
      } else {
        setTab(order[(index - 1 + order.length) % order.length]);
      }
    }
    startX.current = null;
  };

  const renderContent = (data: RecordData) => {
    const parsedDate =
      typeof data.date === 'string' ? new Date(data.date) : data.date;
    const formattedDate = format(parsedDate, 'PPP');
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            {convertWeight(data.weight)} {weightUnit}
          </span>
          <span className="text-lg text-muted-foreground">x {data.reps}</span>
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
    );
  };

  return (
    <Card
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-2">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="reps">Reps</TabsTrigger>
          </TabsList>
          <TabsContent value="weight">
            {renderContent(records.weight)}
          </TabsContent>
          <TabsContent value="volume">
            {renderContent(records.volume)}
          </TabsContent>
          <TabsContent value="reps">{renderContent(records.reps)}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
