'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download, Share } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator).standalone 
      || document.referrer.includes('android-app://')
    if (isStandaloneMode) {
      setIsStandalone(true)
      return
    }

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    if (isIosDevice && !(window.navigator).standalone) {
      // Show after 5 seconds to not annoy immediately
      const timer = setTimeout(() => setShowPrompt(true), 5000)
      return () => clearTimeout(timer)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      import('sonner').then(({ toast }) => {
        toast.success("Installation lancée !", {
          description: "Merci d'utiliser l'application Velo Du Pelo."
        })
      })
      setDeferredPrompt(null)
      setShowPrompt(false)
    } else {
      import('sonner').then(({ toast }) => {
        toast.info("Installation annulée", {
          description: "Vous pourrez toujours l'installer plus tard via le menu du navigateur."
        })
      })
    }
  }
  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <Card className="border-primary/20 shadow-2xl bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Download className="h-4 w-4" />
                Velo Du Pelo
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Installez l'application pour un accès rapide et une meilleure expérience mobile.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 -mt-1 -mr-1 rounded-full hover:bg-muted" 
              onClick={() => setShowPrompt(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4">
            {isIos ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-[11px] bg-primary/5 text-primary py-3 px-4 rounded-xl border border-primary/10">
                  <span className="text-muted-foreground">1. Appuyez sur</span>
                  <div className="bg-background p-1 rounded-md shadow-sm">
                    <Share className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] bg-primary/5 text-primary py-3 px-4 rounded-xl border border-primary/10">
                  <span className="text-muted-foreground">2. Puis sur</span>
                  <span className="font-bold border-b-2 border-primary/20">"Sur l'écran d'accueil"</span>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full h-9 text-xs font-semibold gap-2 shadow-sm" 
                onClick={handleInstallClick}
              >
                Installer l'app
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
