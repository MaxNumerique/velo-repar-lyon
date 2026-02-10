import RepairOrderForm from '@/components/RepairOrderForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8 text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Velo <span className="text-blue-600">Repar</span> Lyon
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Réparateur de vélos à domicile sur Lyon. Service rapide, fiable et moderne.
        </p>
      </div>

      <RepairOrderForm />
    </main>
  );
}

