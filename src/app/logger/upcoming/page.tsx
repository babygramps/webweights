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
import { getAllUpcomingWorkouts } from '../actions';

export default async function UpcomingWorkoutsPage() {
  const workouts = await getAllUpcomingWorkouts();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Upcoming Workouts</h1>
        {workouts.length === 0 ? (
          <p className="text-muted-foreground">
            No upcoming workouts scheduled.
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
      <Link href="/logger" className="block">
        <Button variant="outline" className="w-full">
          Back to This Week
        </Button>
      </Link>
    </div>
  );
}
