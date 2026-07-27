'use client'

import { Calendar as CalendarIcon, CheckCircle2, Loader2, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { fr } from 'date-fns/locale'
import { STATUS_CONFIG } from '@/features/interventions/constants'

function getFormHours(formData, isEdit) {
  if (isEdit && formData.scheduledAt) {
    return new Date(formData.scheduledAt).getHours().toString().padStart(2, '0');
  }
  if (formData.time && typeof formData.time === 'string') {
    const parts = formData.time.split(':');
    return parts[0] || '';
  }
  return '';
}

function getFormMinutes(formData, isEdit) {
  if (isEdit && formData.scheduledAt) {
    return new Date(formData.scheduledAt).getMinutes().toString().padStart(2, '0');
  }
  if (formData.time && typeof formData.time === 'string') {
    const parts = formData.time.split(':');
    return parts[1] || '';
  }
  return '';
}

export default function InterventionScheduler({ 
  formData, 
  updateForm, 
  loading, 
  technicians = [], 
  isEdit = false,
  disabled = false 
}) {
  const selectedDate = formData.date ? new Date(formData.date) : (formData.scheduledAt ? new Date(formData.scheduledAt) : null);

  const handleDateSelect = (date) => {
    if (!date) return;
    if (isEdit) {
      const current = formData.scheduledAt ? new Date(formData.scheduledAt) : new Date();
      const next = new Date(date);
      next.setHours(current.getHours(), current.getMinutes(), 0, 0);
      updateForm({ scheduledAt: next.toISOString().slice(0, 16) });
    } else {
      updateForm({ date: format(date, 'yyyy-MM-dd') });
    }
  };

  return (
    <Card className={`transition-opacity duration-300 ${disabled ? 'opacity-50' : 'opacity-100'} bg-slate-50 border-dashed relative overflow-hidden`}>
      {disabled && !isEdit && (
        <div className="absolute inset-0 z-50 bg-slate-50/20 backdrop-blur-[1px] flex items-center justify-center p-6 text-center">
          <p className="text-[11px] font-bold text-slate-500 bg-white/90 px-3 py-2 rounded-lg shadow-sm border border-slate-100">
            Renseignez d'abord les informations client
          </p>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" /> Planification
        </CardTitle>
        {!isEdit && (
          <CardDescription className="text-[11px]">
            Le technicien sera assigné automatiquement selon le secteur de l'adresse.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEdit && (
          <div className="space-y-2">
            <Label className="text-xs">Statut du ticket</Label>
            <Select 
              value={formData.status || undefined} 
              onValueChange={val => updateForm({ status: val })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="En attente" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs">Date d'intervention <span className="text-destructive">*</span></Label>
          
          <div className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  disabled={disabled}
                  className={cn(
                    "w-full justify-start text-left font-bold h-11 rounded-xl bg-white border-slate-200 shadow-sm",
                    !selectedDate && "text-slate-500"
                  )}
                >
                  <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => 
                    date < new Date(new Date().setHours(0,0,0,0)) || 
                    date.getDay() === 0 || 
                    date.getDay() === 6
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Heure</Label>
                <Select 
                  disabled={disabled}
                  value={getFormHours(formData, isEdit)} 
                  onValueChange={(h) => {
                    if (isEdit) {
                      const current = new Date(formData.scheduledAt);
                      current.setHours(parseInt(h), current.getMinutes());
                      updateForm({ scheduledAt: current.toISOString().slice(0, 16) });
                    } else {
                      const m = getFormMinutes(formData, false) || "00";
                      updateForm({ time: `${h}:${m}` });
                    }
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => i + 9).map(h => {
                      const isPast = selectedDate && selectedDate.toDateString() === new Date().toDateString() && h <= new Date().getHours();
                      return (
                        <SelectItem key={h} value={h.toString().padStart(2, '0')} disabled={isPast}>
                          {h}h {isPast && "(Passé)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Minutes</Label>
                <Select 
                  disabled={disabled}
                  value={getFormMinutes(formData, isEdit)} 
                  onValueChange={(m) => {
                    if (isEdit) {
                      const current = new Date(formData.scheduledAt);
                      current.setMinutes(parseInt(m));
                      updateForm({ scheduledAt: current.toISOString().slice(0, 16) });
                    } else {
                      const h = getFormHours(formData, false) || "09";
                      updateForm({ time: `${h}:${m}` });
                    }
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-white">
                    <SelectValue placeholder="mm" />
                  </SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label className="text-xs">Technicien assigné</Label>
            <Select 
              value={formData.technicianId} 
              onValueChange={val => updateForm({ technicianId: val })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un technicien" />
              </SelectTrigger>
              <SelectContent>
                {technicians
                  .map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <p className="text-[10px] text-slate-500 italic mt-1">
          {isEdit ? "Modification manuelle du rendez-vous." : "Les horaires d'intervention sont de 09h00 à 19h00."}
        </p>
        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full gap-2 font-bold shadow-lg shadow-primary/20 text-xs" 
            disabled={loading || disabled}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isEdit ? "Enregistrer les modifications" : "Créer l'intervention"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
