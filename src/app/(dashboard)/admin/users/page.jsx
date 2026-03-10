'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  UserPlus,
  Mail,
  Phone,
  Loader2,
  Edit2,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/lib/notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils'

import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [error, setError] = useState(null)
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'CLIENT',
    password: ''
  })

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  })

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
        ...(search ? { search } : {}),
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, roleFilter])

  const handleToggleBlock = async (user) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !user.isBlocked })
      })
      if (res.ok) {
        showToast.user.blocked(!user.isBlocked)
        fetchUsers()
      } else {
        showToast.user.error()
      }
    } catch (error) {
      console.error('Toggle block failed', error)
      showToast.user.error()
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/users/${itemToDelete.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showToast.user.deleted()
        setIsDeleteDialogOpen(false)
        fetchUsers()
      } else {
        showToast.user.error()
      }
    } catch (error) {
      console.error('Delete failed', error)
      showToast.user.error()
    } finally {
      setIsUpdating(false)
      setItemToDelete(null)
    }
  }

  const confirmDelete = (user) => {
    setItemToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'La création a échoué')
      }

      setIsCreateOpen(false)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'CLIENT',
        password: ''
      })
      showToast.user.created()
      fetchUsers()
    } catch (error) {
      console.error('Create failed', error)
      setError(error.message)
      showToast.user.error(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'La mise à jour a échoué')
      }

      setIsEditOpen(false)
      showToast.user.updated()
      fetchUsers()
    } catch (error) {
      console.error('Update failed', error)
      setError(error.message)
      showToast.user.error(error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setEditData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    })
    setIsEditOpen(true)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminHeader 
          title="Gestion des Utilisateurs"
          description="Gérez les accès et les rôles de la plateforme."
          icon={Users}
        />
        <Button size="sm" className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Nouvel Utilisateur
        </Button>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Prénom</Label>
                <Input 
                  required 
                  value={editData.firstName}
                  onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nom</Label>
                <Input 
                  required 
                  value={editData.lastName}
                  onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input 
                required 
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Rôle</Label>
              <Select 
                value={editData.role} 
                onValueChange={(val) => setEditData({...editData, role: val})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="TECHNICIAN">Technicien</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>
                Annuler
              </Button>
              <Button type="submit" disabled={isUpdating} className="gap-2">
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Prénom</Label>
                <Input 
                  required 
                  placeholder="Jean" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nom</Label>
                <Input 
                  required 
                  placeholder="Dupont" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input 
                required 
                type="email" 
                placeholder="jean@exemple.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Mot de passe provisoire (min 8 caractères)</Label>
              <div className="space-y-1">
                <Input 
                  required 
                  type="password" 
                  minLength={8}
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value})
                    if (error) setError(null)
                  }}
                />
                {error && (
                  <p className="text-[11px] text-red-500 font-medium leading-tight">{error}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Rôle</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="TECHNICIAN">Technicien</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer l'utilisateur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher par nom, email..." 
            className="pl-9 h-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800">
        <Button 
          variant={roleFilter === 'ALL' ? 'default' : 'ghost'} 
          size="sm" 
          className="text-xs h-8 rounded-full"
          onClick={() => setRoleFilter('ALL')}
        >
          Tous
        </Button>
        <Button 
          variant={roleFilter === 'ADMIN' ? 'default' : 'ghost'} 
          size="sm" 
          className="text-xs h-8 rounded-full"
          onClick={() => setRoleFilter('ADMIN')}
        >
          Admins
        </Button>
        <Button 
          variant={roleFilter === 'TECHNICIAN' ? 'default' : 'ghost'} 
          size="sm" 
          className="text-xs h-8 rounded-full"
          onClick={() => setRoleFilter('TECHNICIAN')}
        >
          Techniciens
        </Button>
        <Button 
          variant={roleFilter === 'CLIENT' ? 'default' : 'ghost'} 
          size="sm" 
          className="text-xs h-8 rounded-full"
          onClick={() => setRoleFilter('CLIENT')}
        >
          Clients
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          users.map((user) => (
            <Card key={user.id} className={cn(
              "overflow-hidden transition-all",
              user.isBlocked && "opacity-60 grayscale"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-sm flex-shrink-0">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate">
                          {user.firstName} {user.lastName}
                        </h3>
                        {user.isBlocked && (
                          <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                            Bloqué
                          </span>
                        )}
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          user.role === 'ADMIN' ? "bg-purple-100 text-purple-600" :
                          user.role === 'TECHNICIAN' ? "bg-blue-100 text-blue-600" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 truncate">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(user)} className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleBlock(user)} className="gap-2">
                        {user.isBlocked ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            Débloquer
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            Bloquer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmDelete(user)} className="text-red-600 gap-2">
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader className="pt-4">
            <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
               <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center text-xl">Supprimer l'utilisateur ?</DialogTitle>
            <DialogDescription className="text-center pt-2 text-slate-500 dark:text-slate-400">
              Êtes-vous sûr de vouloir supprimer <strong>{itemToDelete?.firstName} {itemToDelete?.lastName}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 pt-6 pb-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isUpdating} className="px-6 h-11 font-bold border-slate-200 dark:border-slate-800">
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isUpdating} className="px-6 h-11 font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none">
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oui, supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
