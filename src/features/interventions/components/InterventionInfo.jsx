import { Calendar, Clock } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/dateUtils'

export function InterventionInfo({ date }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 flex items-center gap-2">
        <Calendar className="w-4 h-4" /> Rendez-vous
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 underline decoration-primary/30 underline-offset-4">Date</p>
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Calendar className="w-4 h-4 text-primary" />
            {formatDate(date)}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 underline decoration-primary/30 underline-offset-4">Heure</p>
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-primary" />
            {formatTime(date)}
          </div>
        </div>
      </div>
    </section>
  )
}
