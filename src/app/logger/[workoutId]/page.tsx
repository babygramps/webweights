import { WorkoutLogger } from '@/components/logger/workout-logger';

export default async function WorkoutLoggerPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <WorkoutLogger workoutId={workoutId} />
    </div>
  );
}
