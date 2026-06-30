'use client'

import SectorMap from '@/features/sectors/components/SectorMap';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { MapPin } from 'lucide-react';

export default function SectorsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <AdminHeader 
        title="Secteurs d'intervention"
        description="Utilisez la carte pour délimiter les zones géographiques de Lyon. Ces secteurs permettent d'assigner automatiquement les techniciens aux demandes de réparation."
        icon={MapPin}
      />
      <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 md:p-6">
        <SectorMap />
      </div>
    </div>
  );
}
