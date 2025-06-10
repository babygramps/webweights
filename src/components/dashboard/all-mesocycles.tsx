'use client';

import logger from '@/lib/logger';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/utils/date';

interface Mesocycle {
  id: string;
  title: string;
  start_date: string;
  weeks: number;
  is_default?: boolean | null;
}

export function AllMesocycles() {
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMesocycles = async () => {
      try {
        logger.log('[AllMesocycles] Fetching mesocycles…');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          logger.log('[AllMesocycles] No user found');
          return;
        }

        const { data, error } = await supabase
          .from('mesocycles')
          .select('id, title, start_date, weeks, is_default')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (error) {
          logger.error('[AllMesocycles] Failed to fetch mesocycles', error);
          throw error;
        }

        if (data) {
          logger.log('[AllMesocycles] Retrieved mesocycles:', data);
          setMesocycles(data);
        }
      } catch (err: unknown) {
        const error = err as Error;
        logger.error('[AllMesocycles] Unexpected error', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
          err,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMesocycles();
  }, []);

  const handleSetDefault = async (mesocycleId: string) => {
    try {
      const supabase = createClient();

      logger.log('[AllMesocycles] Setting default mesocycle:', mesocycleId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Clear current defaults for user
      await supabase
        .from('mesocycles')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('mesocycles')
        .update({ is_default: true })
        .eq('id', mesocycleId);

      if (error) {
        logger.error('Failed to set default mesocycle:', error);
        throw error;
      }

      // Refresh local state so list updates immediately
      setMesocycles((prev) =>
        prev.map((m) => ({ ...m, is_default: m.id === mesocycleId })),
      );

      // Notify other components that the default changed
      window.dispatchEvent(new Event('default-mesocycle-changed'));
    } catch (err) {
      const error = err as Error;
      logger.error('[AllMesocycles] Error setting default', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mesocycles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Mesocycles</CardTitle>
          <CardDescription>
            Create a program to start tracking your progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/builder">
            <Button className="w-full">Create Mesocycle</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Mesocycles</CardTitle>
        <CardDescription>Your full training history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mesocycles.map((meso) => {
          const start = parseLocalDate(meso.start_date);
          const end = new Date(start);
          end.setDate(end.getDate() + meso.weeks * 7);

          return (
            <div
              key={meso.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div>
                <p className="font-medium">{meso.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(start, 'MMM d, yyyy')} – {format(end, 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {meso.is_default ? (
                  <span className="text-sm text-primary font-medium">
                    Default
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetDefault(meso.id)}
                  >
                    Set Default
                  </Button>
                )}
                <Link href={`/mesocycles/${meso.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
