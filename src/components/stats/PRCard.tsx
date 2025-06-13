'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import { formatLocalDate } from '@/lib/utils/date';
import { useUserPreferences } from '@/lib/contexts/UserPreferencesContext';
import { useState, useRef } from 'react';

interface WeightRecord {
  weight: number;
  reps: number;
  date: Date | string;
}

interface VolumeRecord {
  volume: number;
  date: Date | string;
}

interface RepsRecord {
  reps: number;
  date: Date | string;
}

interface PRCardProps {
  exerciseName: string;
  maxWeight: WeightRecord | null;
  maxVolume: VolumeRecord | null;
  maxReps: RepsRecord | null;
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

  const renderWeight = (data: WeightRecord | null) => {
    if (!data) return <p className="text-sm">No data</p>;
    const parsedDate = typeof data.date === 'string' ? data.date : data.date;
    const formattedDate = formatLocalDate(parsedDate, 'MM/dd/yyyy');
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

  const renderVolume = (data: VolumeRecord | null) => {
    if (!data) return <p className="text-sm">No data</p>;
    const parsedDate = typeof data.date === 'string' ? data.date : data.date;
    const formattedDate = formatLocalDate(parsedDate, 'MM/dd/yyyy');
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            {convertWeight(data.volume)} {weightUnit}
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          {formattedDate}
        </div>
      </div>
    );
  };

  const renderReps = (data: RepsRecord | null) => {
    if (!data) return <p className="text-sm">No data</p>;
    const parsedDate = typeof data.date === 'string' ? data.date : data.date;
    const formattedDate = formatLocalDate(parsedDate, 'MM/dd/yyyy');
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{data.reps} reps</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          {formattedDate}
        </div>
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
            {renderWeight(records.weight)}
          </TabsContent>
          <TabsContent value="volume">
            {renderVolume(records.volume)}
          </TabsContent>
          <TabsContent value="reps">{renderReps(records.reps)}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
