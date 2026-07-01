'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Ticket, 
  Calendar, 
  Bike,
  Loader2,
  Search,
  ArrowUpDown,
  Plus,
  Filter,
  Users,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { showToast } from '@/lib/notifications'
import Link from 'next/link'
import { InterventionDetails } from '@/features/interventions/components/InterventionDetails'
import { STATUS_CONFIG } from '@/features/interventions/constants';
import { calculateDistance, getAdminInterventions, updateAdminIntervention, cancelInterventionClient, deleteAdminIntervention } from '@/features/interventions/services/interventionService'
import { BookingConfirmationModal } from '@/features/interventions/components/BookingConfirmationModal'
import { InterventionCard } from '@/features/interventions/components/InterventionCard'
import { Pagination } from '@/components/shared/Pagination'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { getTechnicians } from '@/features/users/services/userService'

const ITEMS_PER_PAGE = 10

export function InterventionsDashboard() {
  const { user: clerkUser, isLoaded } = useUser()
  const role = clerkUser?.publicMetadata?.role || 'CLIENT'
  const isTechnician = role === 'TECHNICIAN'
  const isAdmin = role === 'ADMIN'
  const isClient = role === 'CLIENT'

  const [interventions, setInterventions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(isAdmin ? 'ALL' : isClient ? 'UPCOMING' : 'TODAY')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('DATE_ASC')
  const [userCoords, setUserCoords] = useState(null)
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [technicians, setTechnicians] = useState([])
  const [selectedTechFilter, setSelectedTechFilter] = useState('ALL')
  const [activeTool, setActiveTool] = useState(null) 
  const [currentPage, setCurrentPage] = useState(1)

  const searchParams = useSearchParams()
  const router = useRouter()
  const requestedId = searchParams.get('id')
  const scrollRef = useRef(false)

  useEffect(() => {
    if (isLoaded) {
      setActiveTab(isAdmin ? 'ALL' : isClient ? 'UPCOMING' : 'TODAY')
      setCurrentPage(1)
    }
  }, [isLoaded, isClient, isAdmin])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, sortBy, statusFilter, selectedTechFilter])

  useEffect(() => {
    if (isLoaded && clerkUser) {
      if (!searchQuery) {
        fetchInterventions()
      } else {
        const timer = setTimeout(() => {
          fetchInterventions()
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [isLoaded, clerkUser, searchQuery, statusFilter])

  useEffect(() => {
    if (isLoaded && clerkUser && isTechnician && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Geolocation error:", err)
      )
    }
  }, [isLoaded, clerkUser, isTechnician])

  useEffect(() => {
    if (isLoaded && clerkUser && isAdmin) {
      const fetchTechs = async () => {
        try {
          const data = await getTechnicians()
          setTechnicians(Array.isArray(data) ? data : [])
        } catch (error) {
          console.error("Erreur lors du chargement des techniciens :", error)
        }
      }
      fetchTechs()
    }
  }, [isLoaded, clerkUser, isAdmin])

  useEffect(() => {
    if (!loading && requestedId && interventions.length > 0 && !scrollRef.current) {
      const target = interventions.find(a => a.id === requestedId)
      if (target) {
        setActiveTab('ALL')
        setSelectedIntervention(target)
        setTimeout(() => {
          const element = document.getElementById(`intervention-${requestedId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            scrollRef.current = true
          }
        }, 100)
      }
    }
  }, [loading, requestedId, interventions])

  const fetchInterventions = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      })
      const data = await getAdminInterventions(params.toString())
      setInterventions(data)
    } catch (error) {
      showToast.error("Erreur lors du chargement des interventions")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    if (!isTechnician && !isAdmin) return
    try {
      await updateAdminIntervention(id, { status: newStatus })
      setInterventions(prev => prev.map(a => a.id === id ? { 
        ...a, 
        status: newStatus 
      } : a))
      setSelectedIntervention(prev => 
        prev?.id === id ? { ...prev, status: newStatus } : prev
      )
      showToast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`)
      if (newStatus === 'COMPLETED') {
        fetchInterventions()
      }
    } catch (error) {
      showToast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const handleDelete = async (id) => {
    try {
      if (isAdmin) {
        await deleteAdminIntervention(id)
        showToast.success('Intervention supprimée')
      } else if (isClient) {
        await cancelInterventionClient(id)
        showToast.success('Intervention annulée')
      }
      fetchInterventions()
      setSelectedIntervention(null)
    } catch (error) {
      showToast.error(error.message || "Erreur lors de l'annulation")
    }
  }

  const filteredAndSortedInterventions = interventions.filter(intervention => {
    const dateToUse = intervention.scheduledAt || intervention.createdAt
    const statusToUse = intervention.status
    if (!dateToUse) return false
    const interventionDate = new Date(dateToUse)
    const todayDate = new Date()
    const isToday = interventionDate.toDateString() === todayDate.toDateString()
    const isUpcoming = interventionDate > todayDate && !isToday
    
    let passTab = true
    if (activeTab === 'TODAY') {
      passTab = isToday && !['COMPLETED', 'CANCELLED'].includes(statusToUse)
    }
    else if (activeTab === 'UPCOMING') {
      if (isClient) {
        passTab = (isToday || isUpcoming) && !['COMPLETED', 'CANCELLED'].includes(statusToUse)
      } else {
        passTab = isUpcoming && !['COMPLETED', 'CANCELLED'].includes(statusToUse)
      }
    }
    else if (activeTab === 'HISTORY') {
      passTab = statusToUse === 'COMPLETED' || statusToUse === 'CANCELLED'
    }

    if (!passTab) return false
    if (statusFilter !== 'ALL' && statusToUse !== statusFilter) return false
    if (isAdmin && selectedTechFilter !== 'ALL' && intervention.technicianId !== selectedTechFilter) return false
    
    const searchLower = searchQuery.toLowerCase()
    const clientName = `${intervention.clientFirstName || ''} ${intervention.clientLastName || ''} ${intervention.user?.firstName || ''} ${intervention.user?.lastName || ''}`.toLowerCase()
    return clientName.includes(searchLower) || intervention.address.toLowerCase().includes(searchLower)
  })
  .sort((a, b) => {
    if (sortBy === 'DATE_ASC') {
      return new Date(a.scheduledAt || a.createdAt) - new Date(b.scheduledAt || b.createdAt)
    }
    if (sortBy === 'DATE_DESC') {
      return new Date(b.scheduledAt || b.createdAt) - new Date(a.scheduledAt || a.createdAt)
    }
    if (sortBy === 'STATUS') {
      return (a.status || '').localeCompare(b.status || '')
    }
    if (sortBy === 'PRICE_DESC') {
      return (b.servicePackage?.price || 0) - (a.servicePackage?.price || 0)
    }
    if (sortBy === 'DISTANCE' && userCoords) {
      const distA = calculateDistance(userCoords.lat, userCoords.lng, a.lat, a.lng)
      const distB = calculateDistance(userCoords.lat, userCoords.lng, b.lat, b.lng)
      return distA - distB
    }
    return 0
  })

  const totalPages = Math.ceil(filteredAndSortedInterventions.length / ITEMS_PER_PAGE)
  const paginatedInterventions = filteredAndSortedInterventions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const adminTabs = [
    { id: 'ALL', label: "Toutes les interventions" },
    { id: 'TODAY', label: "Aujourd'hui" },
    { id: 'UPCOMING', label: "À venir" },
    { id: 'HISTORY', label: "Historique" }
  ]

  const clientTabs = [
    { id: 'UPCOMING', label: "Aujourd'hui & À venir" },
    { id: 'HISTORY', label: "Historique" },
    { id: 'ALL', label: "Toutes" }
  ]
  
  const techTabs = [
    { id: 'TODAY', label: "Aujourd'hui" },
    { id: 'UPCOMING', label: "À venir" },
    { id: 'HISTORY', label: "Historique" },
    { id: 'ALL', label: "Toutes" }
  ]

  const tabsToDisplay = isAdmin ? adminTabs : isClient ? clientTabs : techTabs

  const sortOptions = [
    { id: 'DATE_DESC', label: "Plus récent" },
    { id: 'DATE_ASC', label: "Plus ancien" },
    ...(isAdmin ? [{ id: 'STATUS', label: "Par statut" }] : []),
    ...(!isAdmin ? [{ id: 'PRICE_DESC', label: "Prix : Décroissant" }] : []),
    ...(isTechnician && userCoords ? [{ id: 'DISTANCE', label: "Proximité" }] : [])
  ]

  return (
    <div className="space-y-6 pb-20">
      <AdminHeader
        title={isAdmin ? "Interventions" : isClient ? "Mes Demandes" : "Mes Interventions"}
        description={
          isClient 
            ? "Suivez l'état de vos réparations en temps réel."
            : activeTab === 'TODAY' 
              ? "À réaliser aujourd'hui" 
              : activeTab === 'UPCOMING' 
                ? "Prochainement" 
                : activeTab === 'HISTORY' 
                  ? "Historique" 
                  : "Toutes les interventions"
        }
        icon={isAdmin ? Ticket : Bike}
        uppercase
        hideDescriptionMobile
        action={
          (isAdmin || isClient) && (
            <Link href={isAdmin ? "/admin/interventions/new" : "/repair"}>
              <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 h-9 md:h-10 text-xs md:text-sm px-3 md:px-5">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{isAdmin ? "Nouveau" : "Nouvelle demande"}</span>
                <span className="sm:hidden">{isAdmin ? "Nouveau" : "Nouveau"}</span>
              </Button>
            </Link>
          )
        }
      />

      <div className="hidden md:flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder={isAdmin ? "Rechercher par client, adresse..." : "Rechercher une intervention, un client..."}
            className="pl-9 h-11 bg-transparent border-none focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-[160px] h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Période" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {tabsToDisplay.map(tab => (
                <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Tous les statuts" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Trier par" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {sortOptions.map(opt => (
                <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={selectedTechFilter} onValueChange={setSelectedTechFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Technicien" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="ALL">Tous les techniciens</SelectItem>
                {technicians.map(tech => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="md:hidden w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-12 flex items-center overflow-hidden transition-all duration-300">
        {!activeTool ? (
          <div className="flex w-full h-full divide-x divide-slate-100 dark:divide-slate-700">
            <button 
              onClick={() => setActiveTool('search')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary active:bg-slate-50 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTool('period')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary active:bg-slate-50 transition-colors relative"
            >
              <Calendar className="w-5 h-5" />
              {activeTab !== 'ALL' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-800" />
              )}
            </button>
            <button 
              onClick={() => setActiveTool('status')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary active:bg-slate-50 transition-colors relative"
            >
              <Filter className="w-5 h-5" />
              {statusFilter !== 'ALL' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-900" />
              )}
            </button>
            {isAdmin && (
              <button 
                onClick={() => setActiveTool('technician')}
                className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary active:bg-slate-50 transition-colors relative"
              >
                <Users className="w-5 h-5" />
                {selectedTechFilter !== 'ALL' && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-900" />
                )}
              </button>
            )}
            <button 
              onClick={() => setActiveTool('sort')}
              className="flex-1 flex items-center justify-center text-slate-400 hover:text-primary active:bg-slate-50 transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex w-full h-full items-center px-1 animate-in slide-in-from-right-2 duration-300">
            <div className="flex-1 h-full flex items-center min-w-0">
              {activeTool === 'search' && (
                <div className="flex items-center w-full pl-3">
                  <Search className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                  <input 
                    autoFocus
                    placeholder="Rechercher..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-semibold text-slate-700 dark:text-slate-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
              {activeTool === 'period' && (
                <Select value={activeTab} onValueChange={(val) => {
                  setActiveTab(val)
                  setActiveTool(null)
                }}>
                  <SelectTrigger className="w-full border-none bg-transparent h-full shadow-none focus:ring-0 px-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Période" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {tabsToDisplay.map(tab => (
                      <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {activeTool === 'status' && (
                <Select value={statusFilter} onValueChange={(val) => {
                  setStatusFilter(val)
                  setActiveTool(null)
                }}>
                  <SelectTrigger className="w-full border-none bg-transparent h-full shadow-none focus:ring-0 px-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Filtrer par statut" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {activeTool === 'sort' && (
                <Select value={sortBy} onValueChange={(val) => {
                  setSortBy(val)
                  setActiveTool(null)
                }}>
                  <SelectTrigger className="w-full border-none bg-transparent h-full shadow-none focus:ring-0 px-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Trier par" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {sortOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {activeTool === 'technician' && (
                <Select value={selectedTechFilter} onValueChange={(val) => {
                  setSelectedTechFilter(val)
                  setActiveTool(null)
                }}>
                  <SelectTrigger className="w-full border-none bg-transparent h-full shadow-none focus:ring-0 px-4 font-bold text-sm text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="Filtrer par technicien" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="ALL">Tous les techniciens</SelectItem>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <button 
              onClick={() => setActiveTool(null)}
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-slate-500">{isAdmin ? "Chargement..." : "Chargement de vos données..."}</p>
          </div>
        ) : filteredAndSortedInterventions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center animate-in fade-in duration-300">
            <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-lg font-bold">
              {isClient ? "Aucune demande trouvée" : "Aucune intervention"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
              {searchQuery 
                ? "Aucun résultat pour votre recherche." 
                : interventions.length === 0 
                  ? (isClient ? "Vous n'avez pas encore de demande en cours." : "Aucune intervention dans le système.") 
                  : "Aucune demande dans cette catégorie."
              }
            </p>
            {isClient && !searchQuery && (
              <Button 
                onClick={() => router.push('/repair')}
                className="mt-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-12 cursor-pointer"
              >
                {interventions.length === 0 ? "Créer ma première demande" : "Nouvelle demande"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paginatedInterventions.map((intervention) => (
              <div key={intervention.id} id={`intervention-${intervention.id}`}>
                <InterventionCard 
                  intervention={intervention}
                  mode={isAdmin ? 'ADMIN' : role}
                  userCoords={userCoords}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={isAdmin || isClient ? handleDelete : undefined}
                  onShowDetails={setSelectedIntervention}
                />
              </div>
            ))}
            
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>

      <InterventionDetails 
        intervention={selectedIntervention}
        open={!!selectedIntervention}
        onOpenChange={(open) => !open && setSelectedIntervention(null)}
        role={isAdmin ? 'ADMIN' : role}
      />

      <BookingConfirmationModal onSuccess={fetchInterventions} />
    </div>
  )
}
