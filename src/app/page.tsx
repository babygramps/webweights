import { AuthForm } from '@/components/auth/auth-form';
import { Dumbbell } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Dumbbell className="h-12 w-12 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                WeightTracker
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Design mesocycles, log workouts, and track your progress with the
              modern weightlifting companion.
            </p>
          </div>

          {/* Auth Form */}
          <AuthForm />

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Visualize your strength gains with detailed analytics
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">⏱️</span>
              </div>
              <h3 className="font-semibold">Smart Logger</h3>
              <p className="text-sm text-muted-foreground">
                Log sets with built-in rest timer and progress tracking
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold">Program Builder</h3>
              <p className="text-sm text-muted-foreground">
                Design custom mesocycles tailored to your goals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
