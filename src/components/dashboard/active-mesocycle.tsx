'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Dumbbell, Plus, ArrowRight, Pencil } from 'lucide-react';
import Link from 'next/link';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { parseLocalDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';

interface Mesocycle {
  id: string;
  title: string;
  start_date: string;
  weeks: number;
  workouts?: Workout[];
  mesocycle_progressions?: Array<{
    id: string;
    progression_type: string;
    weekly_progressions: unknown[];
  }>;
}

interface Workout {
  id: string;
  scheduled_for: string;
  label: string;
  week_number?: number;
  intensity_modifier?: object;
  completed?: boolean;
}

export function ActiveMesocycle() {
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    fetchActiveMesocycle();
  }, []);

  const fetchActiveMesocycle = async () => {
    try {
      console.log('Fetching active mesocycle...');
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      // Get the most recent mesocycle
      const { data: mesocycles, error } = await supabase
        .from('mesocycles')
        .select(
          `
          *,
          workouts (
            id,
            scheduled_for,
            label,
            week_number,
            intensity_modifier
          )
        `,
        )
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No mesocycles found - this is expected for new users
          console.log('No mesocycles found for user');
          setMesocycle(null);
          return;
        } else {
          console.error('Error fetching mesocycle:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            error,
          });
          throw error;
        }
      } else {
        console.log('Fetched mesocycle:', mesocycles);

        // Try to fetch progression data separately if mesocycle exists
        if (mesocycles?.id) {
          try {
            const { data: progressions, error: progressionError } =
              await supabase
                .from('mesocycle_progressions')
                .select('id, progression_type, weekly_progressions')
                .eq('mesocycle_id', mesocycles.id);

            if (!progressionError && progressions) {
              mesocycles.mesocycle_progressions = progressions;
              console.log('Fetched progressions:', progressions);
            } else if (progressionError) {
              console.log(
                'No progressions found or table does not exist:',
                progressionError,
              );
            }
          } catch (progressionErr) {
            console.log(
              'Progression fetch failed (this is optional):',
              progressionErr,
            );
          }
        }

        setMesocycle(mesocycles);

        // Get upcoming workouts (next 7 days)
        if (mesocycles?.workouts) {
          const today = startOfDay(new Date());
          console.log(
            '[ActiveMesocycle] Current local date:',
            format(today, 'yyyy-MM-dd EEEE'),
          );

          const upcoming = mesocycles.workouts
            .filter((workout: Workout) => {
              const workoutDate = parseLocalDate(workout.scheduled_for);
              const workoutDay = startOfDay(workoutDate);
              console.log(
                `[ActiveMesocycle] Workout "${workout.label}" scheduled for:`,
                format(workoutDay, 'yyyy-MM-dd EEEE'),
              );
              // Include today's workout and future workouts
              return workoutDay >= today;
            })
            .sort(
              (a: Workout, b: Workout) =>
                parseLocalDate(a.scheduled_for).getTime() -
                parseLocalDate(b.scheduled_for).getTime(),
            )
            .slice(0, 3);

          console.log('[ActiveMesocycle] Upcoming workouts:', upcoming);
          setUpcomingWorkouts(upcoming);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to fetch mesocycle:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        err,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mesocycle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Mesocycle</CardTitle>
          <CardDescription>
            Start by creating your first training program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/builder">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Mesocycle
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const startDate = parseLocalDate(mesocycle.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + mesocycle.weeks * 7);

  const totalDays = mesocycle.weeks * 7;
  const daysElapsed = differenceInDays(new Date(), startDate);
  const progressPercentage = Math.min(
    Math.max((daysElapsed / totalDays) * 100, 0),
    100,
  );
  const currentWeek = Math.floor(daysElapsed / 7) + 1;

  const getWorkoutDateLabel = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{mesocycle.title}</CardTitle>
              <CardDescription>
                Week {currentWeek} of {mesocycle.weeks}
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{format(startDate, 'MMM d, yyyy')}</span>
              <span>{format(endDate, 'MMM d, yyyy')}</span>
            </div>
          </div>
          {mesocycle.mesocycle_progressions?.[0] && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Progression Type
                </span>
                <Badge variant="outline" className="text-xs">
                  {mesocycle.mesocycle_progressions[0].progression_type}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Link href={`/mesocycles/${mesocycle.id}/edit`} className="w-full">
            <Button variant="outline" className="w-full">
              <Pencil className="mr-2 h-4 w-4" /> Edit Mesocycle
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {upcomingWorkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Workouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{workout.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {getWorkoutDateLabel(workout.scheduled_for)}
                      </p>
                      {workout.week_number && (
                        <Badge variant="secondary" className="text-xs">
                          Week {workout.week_number}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/logger/${workout.id}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}

            <Link href="/logger" className="block">
              <Button variant="outline" className="w-full">
                View All Workouts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
