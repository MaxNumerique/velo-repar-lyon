import SectorMap from '@/components/admin/SectorMap';

export const metadata = {
  title: 'Gestion des Secteurs | Vélo du Pélo',
  description: 'Définissez les zones d\'intervention des techniciens.',
};

export default function SectorsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Secteurs d'intervention
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl hidden md:block">
          Utilisez la carte pour délimiter les zones géographiques de Lyon. 
          Ces secteurs permettent d'assigner automatiquement les techniciens aux demandes de réparation.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 md:p-6">
        <SectorMap />
      </div>
    </div>
  );
}
