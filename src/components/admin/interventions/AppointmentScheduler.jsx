'use client'

import { Calendar as CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/notifications'

export default function AppointmentScheduler({ 
  formData, 
  updateForm, 
  loading, 
  assignedTech, 
  technicians = [], 
  isEdit = false,
  disabled = false 
}) {
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
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" /> Planification
          </CardTitle>
          {isEdit && (
            <Select 
              value={formData.status} 
              onValueChange={val => updateForm({ status: val })}
              disabled={disabled}
            >
              <SelectTrigger className="w-32 h-7 text-[10px] font-bold bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {!isEdit && (
          <CardDescription className="text-[11px]">
            Le technicien sera assigné automatiquement selon le secteur de l'adresse.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Date et heure</Label>
          {isEdit ? (
            <Input 
              type="datetime-local" 
              value={formData.scheduledAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => updateForm({ scheduledAt: e.target.value })}
              onBlur={e => {
                const now = new Date().toISOString().slice(0, 16);
                if (e.target.value && e.target.value < now) {
                  updateForm({ scheduledAt: now });
                  showToast.error("La date ne peut pas être dans le passé");
                }
              }}
              disabled={disabled}
            />
          ) : (
            <div className="space-y-4">
              <Input 
                type="date" 
                value={formData.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => updateForm({ date: e.target.value })}
                onBlur={e => {
                  const today = new Date().toISOString().split('T')[0];
                  if (e.target.value && e.target.value < today) {
                    updateForm({ date: today });
                    showToast.error("La date ne peut pas être dans le passé");
                  }
                }}
                disabled={disabled}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-400">Heure</Label>
                  <Select 
                    disabled={disabled}
                    value={formData.time?.split(':')[0] || ""} 
                    onValueChange={(h) => {
                      const m = formData.time?.split(':')[1] || "00";
                      updateForm({ time: `${h}:${m}` });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => i + 9).map(h => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = formData.date === todayStr;
                        const isPast = isToday && h <= new Date().getHours();
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
                  <Label className="text-xs font-bold uppercase text-slate-400">Minutes</Label>
                  <Select 
                    disabled={disabled}
                    value={formData.time?.split(':')[1] || ""} 
                    onValueChange={(m) => {
                      const h = formData.time?.split(':')[0] || "09";
                      updateForm({ time: `${h}:${m}` });
                    }}
                  >
                    <SelectTrigger>
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
          )}
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
                  .filter(tech => tech.technicianProfile)
                  .map(tech => (
                    <SelectItem key={tech.technicianProfile.id} value={tech.technicianProfile.id}>
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
            className="w-full gap-2 font-bold shadow-lg shadow-primary/20" 
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
