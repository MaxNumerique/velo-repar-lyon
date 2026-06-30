'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Filter, 
  UserPlus,
  Loader2,
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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserCard } from '@/features/admin/components/UserCard'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/features/users/services/userService'
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal'
import { AdminToolbar } from '@/features/admin/components/AdminToolbar'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [error, setError] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'CLIENT',
    password: ''
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  })
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
      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={roleLabels}
        filterIcon={Filter}
        filterType="role"
        searchPlaceholder="Rechercher un utilisateur..."
      />
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
      <DeleteConfirmationModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur ?"
        description={
          <>
            Êtes-vous sûr de vouloir supprimer <strong>{itemToDelete?.firstName} {itemToDelete?.lastName}</strong> ? Cette action est irréversible.
          </>
        }
        confirmText="Oui, supprimer"
        isLoading={isUpdating}
      />
    </div>
  )
}
