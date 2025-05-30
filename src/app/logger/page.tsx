import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/utils/date';
import { getWorkoutsForCurrentWeek, createFreestyleWorkout } from './actions';

export default async function LoggerPage() {
  const workouts = await getWorkoutsForCurrentWeek();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Workout Logger</h1>
        {workouts.length === 0 ? (
          <p className="text-muted-foreground">
            No workouts scheduled for this week.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
              <Card key={workout.id}>
                <CardHeader>
                  <CardTitle>{workout.label || 'Workout'}</CardTitle>
                  <CardDescription>
                    {format(
                      parseLocalDate(workout.scheduledFor),
                      'EEEE, MMM d',
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/logger/${workout.id}`}>
                    <Button className="w-full">Start</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <form action={createFreestyleWorkout}>
          <Button type="submit" className="w-full">
            Start Freestyle Workout
          </Button>
        </form>
        <Link href="/stats" className="block">
          <Button variant="outline" className="w-full">
            View History
          </Button>
        </Link>
      </div>
    </div>
  );
}
