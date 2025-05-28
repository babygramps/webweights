import { MesocycleWizard } from '@/components/builder/mesocycle-wizard';

export default function BuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mesocycle Builder</h1>
        <p className="text-muted-foreground mt-2">
          Design your training program with our guided wizard.
        </p>
      </div>

      <MesocycleWizard />
    </div>
  );
}
