'use client'

import { useState, useEffect } from 'react'
import { SignOutButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { showToast } from '@/lib/notifications'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Bell, BellOff, LogOut, Loader2, User as UserIcon, Save, X, Phone, User as UserIconOutline } from 'lucide-react'

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser()
  const { isSupported, subscription, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications()
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  })

  useEffect(() => {
    if (isLoaded && clerkUser) {
      fetchUser()
    }
  }, [isLoaded, clerkUser])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/admin/users/me')
      const data = await res.json()
      setDbUser(data)
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || ''
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAvailability = async (isAvailable) => {
    try {
      const res = await fetch('/api/admin/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      })
      if (res.ok) {
        const updated = await res.json()
        setDbUser(updated)
        showToast.success(isAvailable ? "Vous êtes maintenant disponible" : "Vous n'êtes plus disponible")
      }
    } catch (error) {
      showToast.error("Erreur lors de la mise à jour")
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const updated = await res.json()
        setDbUser(updated)
        setIsEditing(false)
        showToast.success("Profil mis à jour")
      }
    } catch (error) {
      showToast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Chargement de votre profil...</p>
      </div>
    )
  }

  const user = dbUser || {
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    role: 'CLIENT'
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mon Profil</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos informations personnelles et votre compte.</p>
        </div>
        {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Modifier</Button>
        ) : (
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                    <X className="w-4 h-4 mr-1" /> Annuler
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Enregistrer
                </Button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
            <Card className="shadow-sm overflow-hidden rounded-3xl border-none">
                <div className="h-24 bg-gradient-to-br from-primary to-primary/60" />
                <div className="px-6 -mt-10 pb-6 text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-xl mx-auto mb-4 bg-white dark:bg-slate-700 flex items-center justify-center">
                    {clerkUser.imageUrl ? (
                        <img src={clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-12 h-12 text-slate-300" />
                    )}
                    </div>
                    <h3 className="font-bold text-xl">{user.firstName} {user.lastName}</h3>
                    <p className="text-xs text-slate-500 truncate mb-4">{user.email}</p>
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary">
                        {user.role}
                    </span>
                </div>
            </Card>

            {user.role === 'TECHNICIAN' && (
                <Card className="shadow-sm rounded-3xl border-none">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" /> Disponibilité
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                            <div>
                                <p className="text-xs font-bold">Mode travail</p>
                                <p className="text-[10px] text-slate-500">{dbUser.isAvailable ? "Prêt à intervenir" : "Indisponible"}</p>
                            </div>
                            <Switch 
                                checked={dbUser.isAvailable}
                                onCheckedChange={handleUpdateAvailability}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm rounded-3xl border-none">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-sm font-bold">Informations Personnelles</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              {!isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                              <UserIconOutline className="w-3 h-3" /> Prénom
                          </p>
                          <p className="font-bold text-sm">{user.firstName || '-'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                              <UserIconOutline className="w-3 h-3" /> Nom
                          </p>
                          <p className="font-bold text-sm">{user.lastName || '-'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-1 sm:col-span-2">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Téléphone
                          </p>
                          <p className="font-bold text-sm">{user.phone || 'Non renseigné'}</p>
                      </div>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-[10px] uppercase font-black tracking-wider ml-1">Prénom</Label>
                          <Input 
                            id="firstName" 
                            value={formData.firstName} 
                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                            className="rounded-xl"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-[10px] uppercase font-black tracking-wider ml-1">Nom</Label>
                          <Input 
                            id="lastName" 
                            value={formData.lastName} 
                            onChange={e => setFormData({...formData, lastName: e.target.value})}
                            className="rounded-xl"
                          />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="phone" className="text-[10px] uppercase font-black tracking-wider ml-1">Téléphone</Label>
                          <Input 
                            id="phone" 
                            type="tel"
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="rounded-xl"
                            placeholder="06 00 00 00 00"
                          />
                      </div>
                  </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-3xl border-none">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Notifications Push
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {!isSupported ? (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Les notifications push ne sont pas supportées par votre navigateur actuel.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold">Activer les notifications</p>
                      <p className="text-[10px] text-slate-500">
                        {subscription 
                          ? "Vous recevrez des alertes pour vos messages et interventions." 
                          : "Ne ratez aucune mise à jour importante."}
                      </p>
                    </div>
                    {pushLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <Switch 
                        checked={!!subscription}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            subscribe().then(sub => {
                              if (sub) showToast.success("Notifications activées");
                              else showToast.error("Permission refusée ou erreur");
                            });
                          } else {
                            unsubscribe().then(ok => {
                              if (ok) showToast.success("Notifications désactivées");
                            });
                          }
                        }}
                      />
                    )}
                  </div>
                  {subscription && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-center text-slate-400 italic">
                        Les notifications s'afficheront même si l'application est fermée.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] font-bold rounded-xl"
                        onClick={async () => {
                          const res = await fetch('/api/push/test', { method: 'POST' });
                          if (res.ok) showToast.success("Notification de test envoyée !");
                          else showToast.error("Erreur lors de l'envoi");
                        }}
                      >
                        Envoyer une notification de test
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-3xl border-none">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-sm font-bold">Sécurité & Session</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Les données de votre compte sont protégées et synchronisées avec votre profil de connexion. La déconnexion mettra fin à votre session actuelle.</p>
              </div>
              
              <SignOutButton redirectUrl="/">
                <Button variant="destructive" className="w-full md:w-auto gap-2 font-bold shadow-lg shadow-red-500/20 rounded-2xl">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </SignOutButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
