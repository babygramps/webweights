import { WorkoutLogger } from '@/components/logger/workout-logger';

export default function WorkoutLoggerPage({
  params,
}: {
  params: { workoutId: string };
}) {
  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <WorkoutLogger workoutId={params.workoutId} />
    </div>
  );
}
