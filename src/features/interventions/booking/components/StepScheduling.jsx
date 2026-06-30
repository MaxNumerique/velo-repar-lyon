'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle, MapPin, User, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAvailableDays, formatFullDate, isSameSlot } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import { getAvailability } from '@/features/interventions/services/interventionService'
import { useRepair } from '@/features/interventions/booking/context/RepairContext'
import { StepLoading } from './StepLoading'

const HOURS = [9, 10, 11, 14, 15, 16, 17, 18]

export default function StepScheduling({ formData: propFormData, onUpdate: propOnUpdate }) {
  const context = useRepair(false);
  const formData = context ? context.formData : propFormData;
  const onUpdate = context ? context.updateFormData : propOnUpdate;
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [techData, setTechData] = useState(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const days = getAvailableDays(7)

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAvailability(formData.address)
        setTechData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (formData.address) {
      fetchAvailability()
    }
  }, [formData.address])

  const handleSelectSlot = (date, hour) => {
    const scheduledAt = new Date(date)
    scheduledAt.setHours(hour, 0, 0, 0)
    const freeTechnician = techData.technicians.find(t => 
      !t.busySlots.some(busy => isSameSlot(busy, scheduledAt))
    ) || techData.technicians[0]

    onUpdate({ 
      scheduledAt: scheduledAt.toISOString(),
      technicianId: freeTechnician.id,
      technicianName: freeTechnician.name
    })
  }

  if (loading) {
    return <StepLoading message="Recherche d'un technicien dans votre secteur..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 text-center space-y-4">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-red-900">Hors zone de couverture</h3>
          <p className="text-red-700 max-w-sm mx-auto">
            {error}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="rounded-full border-red-200 text-red-700 hover:bg-red-100"
        >
          Réessayer
        </Button>
      </div>
    )
  }

  const currentDay = days[selectedDayIndex]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-primary/5 rounded-[2rem] p-6 flex items-center gap-4">
        <div className="bg-white p-3 rounded-2xl shadow-sm">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Secteur identifié</p>
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{formData.address}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Choisir une date
          </h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              disabled={selectedDayIndex === 0}
              onClick={() => setSelectedDayIndex(prev => prev - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              disabled={selectedDayIndex === days.length - 1}
              onClick={() => setSelectedDayIndex(prev => prev + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto py-4 px-2 no-scrollbar -mx-2">
          {days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={cn(
                  "flex-shrink-0 w-24 p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-1",
                  isSelected 
                    ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                )}
              >
                <span className="text-[10px] font-black uppercase">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
                <span className="text-xl font-black">
                  {day.getDate()}
                </span>
                <span className="text-[10px] font-bold opacity-60">
                  {day.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
              </button>
            )
          })}
        </div>
        <div className="space-y-4 pt-4">
          <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2 px-2">
            <Clock className="w-5 h-5 text-primary" /> Horaires disponibles
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HOURS.map(hour => {
              const date = new Date(currentDay)
              date.setHours(hour, 0, 0, 0)
              const isPast = date < new Date()
              const isBusy = techData.technicians.every(t => 
                t.busySlots.some(busy => isSameSlot(busy, date))
              ) || isPast
              const isSelected = isSameSlot(formData.scheduledAt, date)
              return (
                <button
                  key={hour}
                  disabled={isBusy}
                  onClick={() => handleSelectSlot(currentDay, hour)}
                  className={cn(
                    "p-4 rounded-2xl border-2 font-black transition-all text-center",
                    isBusy 
                      ? "border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed"
                      : isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-slate-100 bg-white text-slate-700 hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {hour}h00
                  {isBusy && <span className="block text-[8px] uppercase tracking-tighter opacity-50">Indisponible</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {formData.scheduledAt && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-6 animate-in zoom-in-95 duration-300">
           <div className="flex items-center gap-4">
              <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Rendez-vous sélectionné</p>
                <p className="font-black text-emerald-900">
                  {formatFullDate(formData.scheduledAt)} à {new Date(formData.scheduledAt).getHours()}h00
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-emerald-600/60 uppercase">
                  <User className="w-3 h-3" /> Technicien : {formData.technicianName}
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
