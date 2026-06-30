'use client'

import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'

export function DeleteConfirmationModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Confirmer la suppression",
  description = "Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  isLoading = false,
  variant = "destructive"
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[2rem] border-none shadow-2xl p-8">
        <DialogHeader className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${variant === 'destructive' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-center">
            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-center gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-2xl h-12 font-bold border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none"
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-2xl h-12 font-bold shadow-lg gap-2 flex-1 sm:flex-none px-6 ${variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Trash2 className="w-4 h-4 text-white" />
            )}
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">{confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
