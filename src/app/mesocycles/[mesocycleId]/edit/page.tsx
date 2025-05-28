import { MesocycleEditor } from '@/components/mesocycles/mesocycle-editor';

export default function EditMesocyclePage({
  params,
}: {
  params: { mesocycleId: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Mesocycle</h1>
      </div>
      <MesocycleEditor mesocycleId={params.mesocycleId} />
    </div>
  );
}
