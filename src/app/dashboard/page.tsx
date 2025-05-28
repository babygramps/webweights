// import { createClient } from '@/lib/supabase/server';
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
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  // TODO: Use supabase to fetch actual data from database
  // const supabase = await createClient();

  // TODO: Fetch actual data from database
  const stats = {
    currentWeek: 3,
    totalWorkouts: 12,
    nextWorkout: 'Push Day',
    personalRecords: 2,
  };

  const recentWorkouts = [
    { id: 1, name: 'Push Day', date: '2025-05-25', sets: 24 },
    { id: 2, name: 'Pull Day', date: '2025-05-23', sets: 22 },
    { id: 3, name: 'Leg Day', date: '2025-05-21', sets: 20 },
  ];

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Week {stats.currentWeek}</div>
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
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">this mesocycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Workout</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nextWorkout}</div>
            <p className="text-xs text-muted-foreground">scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New PRs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.personalRecords}</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardDescription>Your last few training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{workout.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {workout.date} • {workout.sets} sets completed
                  </p>
                </div>
                <Link href={`/logger/${workout.id}`}>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>No Active Mesocycle</CardTitle>
            <CardDescription>
              Start by creating your first training program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/builder">
              <Button className="w-full">Create Mesocycle</Button>
            </Link>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
