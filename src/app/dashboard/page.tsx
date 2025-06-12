import { ActiveMesocycle } from '@/components/dashboard/active-mesocycle';
import { AllMesocycles } from '@/components/dashboard/all-mesocycles';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Calendar,
  Target,
  TrendingUp,
  Plus,
  ArrowRight,
  Dumbbell,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDashboardOverview } from '@/db/queries/dashboard';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const overview = await getDashboardOverview(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your training overview.
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link href="/logger">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
          </Link>
        </div>
      </div>

      {/* Next Workout (first thing users see) */}
      <div className="mb-8">
        {overview.nextWorkout ? (
          <Link href={`/logger/${overview.nextWorkout.id}`} className="block">
            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Workout
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.nextWorkout.label}
                </div>
                <p className="text-xs text-muted-foreground">scheduled today</p>
                {overview.nextWorkout.exercises.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {overview.nextWorkout.exercises.slice(0, 4).map((ex) => (
                      <span
                        key={ex}
                        className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-0.5"
                      >
                        <Dumbbell className="h-3 w-3 text-muted-foreground" />
                        {ex}
                      </span>
                    ))}
                    {overview.nextWorkout.exercises.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{overview.nextWorkout.exercises.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Next Workout
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">None</div>
              <p className="text-xs text-muted-foreground">scheduled today</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Mesocycle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <ActiveMesocycle />
        </div>
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Week
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Week {overview.currentWeek ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">of your mesocycle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Workouts
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalWorkouts}</div>
              <p className="text-xs text-muted-foreground">this mesocycle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New PRs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.personalRecords}
              </div>
              <p className="text-xs text-muted-foreground">this week</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardDescription>Your last few training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview.recentWorkouts.map((workout) => (
              <div
                key={workout.workoutId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{workout.workoutLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    {workout.workoutDate} • {workout.setCount} sets completed
                  </p>
                </div>
                <Link href={`/logger/${workout.workoutId}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/stats">
              <Button variant="outline" className="w-full">
                View All Workouts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* All Mesocycles */}
      <div className="mt-8">
        <AllMesocycles />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Exercise Catalogue</CardTitle>
            <CardDescription>
              Browse and manage your exercise library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/catalogue">
              <Button variant="outline" className="w-full">
                Browse Exercises
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Stats</CardTitle>
            <CardDescription>View your training analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/stats">
              <Button variant="outline" className="w-full">
                View Statistics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training History</CardTitle>
            <CardDescription>Review past workouts and PRs</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/logger">
              <Button variant="outline" className="w-full">
                Workout Log
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
