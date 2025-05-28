'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Dumbbell, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  format,
  differenceInDays,
  isToday,
  isTomorrow,
  isPast,
} from 'date-fns';

interface Mesocycle {
  id: string;
  title: string;
  start_date: string;
  weeks: number;
  workouts?: Workout[];
}

interface Workout {
  id: string;
  scheduled_for: string;
  label: string;
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
            label
          )
        `,
        )
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching mesocycle:', error);
        if (error.code === 'PGRST116') {
          // No mesocycles found
          setMesocycle(null);
        } else {
          throw error;
        }
      } else {
        console.log('Fetched mesocycle:', mesocycles);
        setMesocycle(mesocycles);

        // Get upcoming workouts (next 7 days)
        if (mesocycles?.workouts) {
          const upcoming = mesocycles.workouts
            .filter((workout: Workout) => {
              const workoutDate = new Date(workout.scheduled_for);
              return !isPast(workoutDate) || isToday(workoutDate);
            })
            .sort(
              (a: Workout, b: Workout) =>
                new Date(a.scheduled_for).getTime() -
                new Date(b.scheduled_for).getTime(),
            )
            .slice(0, 3);

          setUpcomingWorkouts(upcoming);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mesocycle:', err);
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

  const startDate = new Date(mesocycle.start_date);
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
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
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
        </CardContent>
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
                    <p className="text-sm text-muted-foreground">
                      {getWorkoutDateLabel(workout.scheduled_for)}
                    </p>
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
