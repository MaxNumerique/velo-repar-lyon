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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/lib/notifications'
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

import { UserCard } from '@/components/admin/UserCard'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/services/users'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTool, setActiveTool] = useState(null) // 'search' or 'role'
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
      const data = await getAdminUsers(params.toString())
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
      await updateAdminUser(user.id, { isBlocked: !user.isBlocked })
      showToast.user.blocked(!user.isBlocked)
      fetchUsers()
    } catch (error) {
      console.error('Toggle block failed', error)
      showToast.user.error()
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setIsUpdating(true)
    try {
      await deleteAdminUser(itemToDelete.id)
      showToast.user.deleted()
      setIsDeleteDialogOpen(false)
      fetchUsers()
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
      await createAdminUser(formData)

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
      await updateAdminUser(selectedUser.id, editData)

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
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'CLIENT'
    })
    setIsEditOpen(true)
    setError(null)
  }

  const roleLabels = {
    'ALL': 'Tous',
    'ADMIN': 'Admins',
    'TECHNICIAN': 'Techniciens',
    'CLIENT': 'Clients'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header unified for desktop */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
             <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Utilisateurs</h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider hidden md:block">Gestion des accès et rôles</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 h-9 md:h-10 text-xs md:text-sm px-3 md:px-5"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvel Utilisateur</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName" className="text-xs">Prénom</Label>
                <Input 
                  id="edit-firstName"
                  required 
                  value={editData.firstName}
                  onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName" className="text-xs">Nom</Label>
                <Input 
                  id="edit-lastName"
                  required 
                  value={editData.lastName}
                  onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-xs">Email</Label>
              <Input 
                id="edit-email"
                required 
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-xs">Rôle</Label>
              <Select 
                value={editData.role} 
                onValueChange={(val) => setEditData({...editData, role: val})}
              >
                <SelectTrigger id="edit-role" className="w-full">
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
                <Label htmlFor="create-firstName" className="text-xs">Prénom</Label>
                <Input 
                  id="create-firstName"
                  required 
                  placeholder="Jean" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastName" className="text-xs">Nom</Label>
                <Input 
                  id="create-lastName"
                  required 
                  placeholder="Dupont" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email" className="text-xs">Email</Label>
              <Input 
                id="create-email"
                required 
                type="email" 
                placeholder="jean@exemple.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password" className="text-xs">Mot de passe provisoire (min 8 caractères)</Label>
              <div className="space-y-1">
                <Input 
                  id="create-password"
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
              <Label htmlFor="create-role" className="text-xs">Rôle</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger id="create-role" className="w-full">
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

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'ADMIN', 'TECHNICIAN', 'CLIENT'].map(tab => (
            <button 
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                roleFilter === tab 
                  ? "bg-slate-900 text-white shadow-md scale-105" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {roleLabels[tab]}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Rechercher un utilisateur..." 
            className="pl-9 h-11 bg-white dark:bg-slate-800 border-none shadow-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile Actions Bar - Compact Pill Mode */}
      <div className="md:hidden flex flex-col gap-3">
        <div className="relative flex items-center justify-center pt-2 pb-2">
           <div className={cn(
              "flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ease-out overflow-hidden",
              activeTool ? "w-full rounded-2xl h-12 px-3" : "w-32 rounded-full h-10 px-1"
           )}>
              {!activeTool ? (
                 <div className="flex items-center justify-around w-full">
                    <button onClick={() => setActiveTool('search')} className="p-2 text-slate-500 hover:text-primary transition-colors">
                       <Search className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200" />
                    <button onClick={() => setActiveTool('role')} className="p-2 text-slate-500 hover:text-primary transition-colors relative">
                       <Filter className="w-5 h-5" />
                       {roleFilter !== 'ALL' && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-900" />
                       )}
                    </button>
                 </div>
              ) : (
                 <div className="flex items-center w-full gap-2 animate-in fade-in zoom-in duration-200">
                    {activeTool === 'search' && (
                       <div className="flex-1 flex items-center gap-2">
                          <Search className="w-4 h-4 text-primary" />
                          <input 
                             autoFocus
                             className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
                             placeholder="Nom, email..."
                             value={search}
                             onChange={(e) => setSearch(e.target.value)}
                          />
                       </div>
                    )}
                    {activeTool === 'role' && (
                       <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                          <Filter className="w-4 h-4 text-primary shrink-0" />
                          <Select value={roleFilter} onValueChange={(val) => {
                             setRoleFilter(val)
                             setActiveTool(null)
                          }}>
                             <SelectTrigger className="border-none shadow-none h-8 p-0 bg-transparent focus:ring-0 text-sm font-bold">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                {Object.entries(roleLabels).map(([val, label]) => (
                                   <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                    )}
                    <button 
                       onClick={() => setActiveTool(null)}
                       className="ml-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                    >
                       <span className="text-lg font-bold">×</span>
                    </button>
                 </div>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Chargement...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl bg-slate-50/50">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {users.map((user) => (
              <UserCard 
                key={user.id}
                user={user}
                onEdit={openEditModal}
                onToggleBlock={handleToggleBlock}
                onDelete={confirmDelete}
              />
            ))}
          </div>
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
