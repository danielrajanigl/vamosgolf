"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Filter,
  Download,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react"

interface TripDate {
  id: string
  trip_id: string
  start_date: string
  end_date: string
  min_participants: number
  max_participants: number
  current_bookings: number
  status: 'planned' | 'confirmed' | 'cancelled'
  supplier_policy: any
  trip_title: string
  trip_slug: string
  trip_image_url: string | null
  trip_base_price_cents: number
  trip_currency: string
  trip_status: 'draft' | 'published'
  trip_destination: string
  available_spots: number
  is_full: boolean
  duration_days: number
}

type SortField = 'start_date' | 'trip_title' | 'trip_destination' | 'duration_days' | 'current_bookings' | 'available_spots'
type ViewMode = 'month' | 'quarter' | 'year' | 'custom'

export default function TerminePage() {
  const [dates, setDates] = useState<TripDate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tripFilter, setTripFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  
  // Sortierung - zwei Kriterien gleichzeitig
  const [primarySort, setPrimarySort] = useState<SortField>("start_date")
  const [primarySortOrder, setPrimarySortOrder] = useState<"asc" | "desc">("asc")
  const [secondarySort, setSecondarySort] = useState<SortField>("trip_title")
  const [secondarySortOrder, setSecondarySortOrder] = useState<"asc" | "desc">("asc")
  
  // Kalender-Ansicht
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  useEffect(() => {
    fetchDates()
  }, [])

  async function fetchDates() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/trip-dates")
      
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Termine")
      }

      const data = await response.json()
      setDates(data.dates || [])
    } catch (error) {
      console.error("Error fetching dates:", error)
    } finally {
      setLoading(false)
    }
  }

  // Eindeutige Reisen für Filter
  const uniqueTrips = useMemo(() => {
    const trips = dates.map(d => ({ id: d.trip_id, title: d.trip_title }))
    const unique = Array.from(new Map(trips.map(t => [t.id, t])).values())
    return unique.sort((a, b) => a.title.localeCompare(b.title))
  }, [dates])

  // Filter und Sortierung
  const filteredAndSortedDates = useMemo(() => {
    let filtered = dates.filter((date) => {
      const matchesSearch = 
        date.trip_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        date.trip_slug?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || date.status === statusFilter
      const matchesTrip = tripFilter === "all" || date.trip_id === tripFilter
      
      const matchesAvailability = 
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && !date.is_full && date.status === 'confirmed') ||
        (availabilityFilter === "full" && date.is_full) ||
        (availabilityFilter === "low" && date.available_spots <= 5 && date.available_spots > 0)

      // Datum-Filter basierend auf View-Mode
      let matchesDate = true
      if (viewMode === "custom" && customStartDate && customEndDate) {
        const start = new Date(date.start_date)
        const filterStart = new Date(customStartDate)
        const filterEnd = new Date(customEndDate)
        matchesDate = start >= filterStart && start <= filterEnd
      } else if (viewMode === "month") {
        const start = new Date(date.start_date)
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        matchesDate = start >= monthStart && start <= monthEnd
      } else if (viewMode === "quarter") {
        const start = new Date(date.start_date)
        const quarter = Math.floor(currentDate.getMonth() / 3)
        const quarterStart = new Date(currentDate.getFullYear(), quarter * 3, 1)
        const quarterEnd = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0)
        matchesDate = start >= quarterStart && start <= quarterEnd
      } else if (viewMode === "year") {
        const start = new Date(date.start_date)
        const yearStart = new Date(currentDate.getFullYear(), 0, 1)
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31)
        matchesDate = start >= yearStart && start <= yearEnd
      }

      return matchesSearch && matchesStatus && matchesTrip && matchesAvailability && matchesDate
    })

    // Doppelte Sortierung
    filtered.sort((a, b) => {
      // Primäre Sortierung
      let aVal: any = a[primarySort as keyof TripDate]
      let bVal: any = b[primarySort as keyof TripDate]

      if (primarySort === 'start_date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      let primaryComparison = 0
      if (primarySortOrder === "asc") {
        primaryComparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        primaryComparison = aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }

      // Wenn primäre Sortierung gleich ist, verwende sekundäre
      if (primaryComparison === 0) {
        let aVal2: any = a[secondarySort as keyof TripDate]
        let bVal2: any = b[secondarySort as keyof TripDate]

        if (secondarySort === 'start_date') {
          aVal2 = new Date(aVal2).getTime()
          bVal2 = new Date(bVal2).getTime()
        } else if (typeof aVal2 === 'string' && typeof bVal2 === 'string') {
          aVal2 = aVal2.toLowerCase()
          bVal2 = bVal2.toLowerCase()
        }

        if (secondarySortOrder === "asc") {
          return aVal2 > bVal2 ? 1 : aVal2 < bVal2 ? -1 : 0
        } else {
          return aVal2 < bVal2 ? 1 : aVal2 > bVal2 ? -1 : 0
        }
      }

      return primaryComparison
    })

    return filtered
  }, [dates, searchTerm, statusFilter, tripFilter, availabilityFilter, primarySort, primarySortOrder, secondarySort, secondarySortOrder, viewMode, currentDate, customStartDate, customEndDate])

  function exportToICS() {
    const params = new URLSearchParams()
    
    if (viewMode === "custom" && customStartDate && customEndDate) {
      params.append('start_date', customStartDate)
      params.append('end_date', customEndDate)
    } else if (viewMode === "month") {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      params.append('start_date', monthStart.toISOString().split('T')[0])
      params.append('end_date', monthEnd.toISOString().split('T')[0])
    } else if (viewMode === "quarter") {
      const quarter = Math.floor(currentDate.getMonth() / 3)
      const quarterStart = new Date(currentDate.getFullYear(), quarter * 3, 1)
      const quarterEnd = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0)
      params.append('start_date', quarterStart.toISOString().split('T')[0])
      params.append('end_date', quarterEnd.toISOString().split('T')[0])
    } else if (viewMode === "year") {
      const yearStart = new Date(currentDate.getFullYear(), 0, 1)
      const yearEnd = new Date(currentDate.getFullYear(), 11, 31)
      params.append('start_date', yearStart.toISOString().split('T')[0])
      params.append('end_date', yearEnd.toISOString().split('T')[0])
    }

    if (tripFilter !== "all") {
      params.append('trip_ids', tripFilter)
    }

    window.open(`/api/admin/trip-dates/export?${params.toString()}`, '_blank')
  }

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate)
    
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === "quarter") {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3))
    } else if (viewMode === "year") {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
    }
    
    setCurrentDate(newDate)
  }

  const stats = useMemo(() => ({
    total: filteredAndSortedDates.length,
    confirmed: filteredAndSortedDates.filter(d => d.status === 'confirmed').length,
    planned: filteredAndSortedDates.filter(d => d.status === 'planned').length,
    cancelled: filteredAndSortedDates.filter(d => d.status === 'cancelled').length,
    available: filteredAndSortedDates.filter(d => !d.is_full && d.status === 'confirmed').length,
    full: filteredAndSortedDates.filter(d => d.is_full).length,
  }), [filteredAndSortedDates])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Lade Termine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Termine verwalten</h1>
          <p className="text-gray-600 mt-2">
            Professionelle Übersicht aller Golfreisen-Termine mit Filter und Kalender
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDates} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button onClick={exportToICS} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ICS Export
          </Button>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>Gesamt</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardDescription>Bestätigt</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.confirmed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardDescription>Geplant</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.planned}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardDescription>Storniert</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.cancelled}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardDescription>Verfügbar</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{stats.available}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-3">
            <CardDescription>Ausgebucht</CardDescription>
            <CardTitle className="text-2xl text-gray-600">{stats.full}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter und Sortierung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Sortierung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Suche nach Reise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="planned">Geplant</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tripFilter} onValueChange={setTripFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Reise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Reisen</SelectItem>
                {uniqueTrips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Verfügbarkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="available">Verfügbar</SelectItem>
                <SelectItem value="low">Wenig Plätze (≤5)</SelectItem>
                <SelectItem value="full">Ausgebucht</SelectItem>
              </SelectContent>
            </Select>

            {/* Sortierung - Primär */}
            <div>
              <Label className="text-xs mb-1 block">Primäre Sortierung</Label>
              <div className="flex gap-2">
                <Select value={primarySort} onValueChange={(v) => setPrimarySort(v as SortField)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start_date">Startdatum</SelectItem>
                    <SelectItem value="trip_title">Reise</SelectItem>
                    <SelectItem value="trip_destination">Destination</SelectItem>
                    <SelectItem value="duration_days">Dauer</SelectItem>
                    <SelectItem value="current_bookings">Buchungen</SelectItem>
                    <SelectItem value="available_spots">Verfügbare Plätze</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrimarySortOrder(p => p === "asc" ? "desc" : "asc")}
                  title={primarySortOrder === "asc" ? "Aufsteigend" : "Absteigend"}
                >
                  {primarySortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>

            {/* Sortierung - Sekundär */}
            <div>
              <Label className="text-xs mb-1 block">Sekundäre Sortierung</Label>
              <div className="flex gap-2">
                <Select value={secondarySort} onValueChange={(v) => setSecondarySort(v as SortField)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start_date">Startdatum</SelectItem>
                    <SelectItem value="trip_title">Reise</SelectItem>
                    <SelectItem value="trip_destination">Destination</SelectItem>
                    <SelectItem value="duration_days">Dauer</SelectItem>
                    <SelectItem value="current_bookings">Buchungen</SelectItem>
                    <SelectItem value="available_spots">Verfügbare Plätze</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSecondarySortOrder(s => s === "asc" ? "desc" : "asc")}
                  title={secondarySortOrder === "asc" ? "Aufsteigend" : "Absteigend"}
                >
                  {secondarySortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Termine-Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Termine ({filteredAndSortedDates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reise</TableHead>
                  <TableHead>Startdatum</TableHead>
                  <TableHead>Enddatum</TableHead>
                  <TableHead>Dauer</TableHead>
                  <TableHead>Teilnehmer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verfügbarkeit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">Keine Termine gefunden</p>
                      <p className="text-sm mt-1">Versuche andere Filtereinstellungen</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedDates.map((date) => (
                    <TableRow key={date.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {date.trip_image_url && (
                            <img 
                              src={date.trip_image_url} 
                              alt="" 
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {date.trip_title}
                              {date.trip_destination && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {date.trip_destination}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{date.trip_slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {new Date(date.start_date).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(date.end_date).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {date.duration_days} {date.duration_days === 1 ? 'Tag' : 'Tage'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className={date.is_full ? "text-red-600 font-medium" : ""}>
                            {date.current_bookings}/{date.max_participants}
                          </span>
                          {date.min_participants > 0 && (
                            <span className="text-xs text-gray-500">
                              (min. {date.min_participants})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {date.status === 'confirmed' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Bestätigt
                          </Badge>
                        )}
                        {date.status === 'planned' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Geplant
                          </Badge>
                        )}
                        {date.status === 'cancelled' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Storniert
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {date.is_full ? (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Ausgebucht
                          </Badge>
                        ) : date.available_spots <= 5 ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Nur {date.available_spots} Plätze
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {date.available_spots} verfügbar
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Kalender-Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Zeitraum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Monat
              </Button>
              <Button
                variant={viewMode === "quarter" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("quarter")}
              >
                Quartal
              </Button>
              <Button
                variant={viewMode === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("year")}
              >
                Jahr
              </Button>
              <Button
                variant={viewMode === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("custom")}
              >
                Benutzerdefiniert
              </Button>
            </div>

            {viewMode !== "custom" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-[200px] text-center">
                  {viewMode === "month" && currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                  {viewMode === "quarter" && `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`}
                  {viewMode === "year" && currentDate.getFullYear()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Heute
                </Button>
              </div>
            )}

            {viewMode === "custom" && (
              <div className="flex items-center gap-2">
                <div>
                  <Label htmlFor="customStart" className="text-xs">Von</Label>
                  <Input
                    id="customStart"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <Label htmlFor="customEnd" className="text-xs">Bis</Label>
                  <Input
                    id="customEnd"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kalender-Grid Ansicht */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Kalender-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView 
            dates={filteredAndSortedDates}
            viewMode={viewMode}
            currentDate={currentDate}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function CalendarView({
  dates,
  viewMode,
  currentDate,
  customStartDate,
  customEndDate,
}: {
  dates: TripDate[]
  viewMode: ViewMode
  currentDate: Date
  customStartDate: string
  customEndDate: string
}) {
  // Generiere Kalender-Grid basierend auf View-Mode
  const calendarDays = useMemo(() => {
    let start: Date
    let end: Date

    if (viewMode === "custom" && customStartDate && customEndDate) {
      start = new Date(customStartDate)
      end = new Date(customEndDate)
    } else if (viewMode === "month") {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    } else if (viewMode === "quarter") {
      const quarter = Math.floor(currentDate.getMonth() / 3)
      start = new Date(currentDate.getFullYear(), quarter * 3, 1)
      end = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0)
    } else {
      start = new Date(currentDate.getFullYear(), 0, 1)
      end = new Date(currentDate.getFullYear(), 11, 31)
    }

    const days: Date[] = []
    const current = new Date(start)
    
    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [viewMode, currentDate, customStartDate, customEndDate])

  // Gruppiere Termine nach Datum
  const datesByDay = useMemo(() => {
    const map = new Map<string, TripDate[]>()
    
    dates.forEach(date => {
      const start = new Date(date.start_date)
      const end = new Date(date.end_date)
      const current = new Date(start)
      
      while (current <= end) {
        const key = current.toISOString().split('T')[0]
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)!.push(date)
        current.setDate(current.getDate() + 1)
      }
    })
    
    return map
  }, [dates])

  if (viewMode === "year") {
    // Jahresansicht: Monate als Grid
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }, (_, i) => {
          const monthDate = new Date(currentDate.getFullYear(), i, 1)
          const monthDates = dates.filter(d => {
            const dDate = new Date(d.start_date)
            return dDate.getMonth() === i && dDate.getFullYear() === currentDate.getFullYear()
          })
          
          return (
            <Card key={i} className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {monthDate.toLocaleDateString('de-DE', { month: 'long' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {monthDates.length === 0 ? (
                    <p className="text-sm text-gray-400">Keine Termine</p>
                  ) : (
                    monthDates.map(date => (
                      <div key={date.id} className="text-sm p-2 bg-blue-50 rounded">
                        <div className="font-medium">{date.trip_title}</div>
                        <div className="text-xs text-gray-600">
                          {new Date(date.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - 
                          {new Date(date.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Monats- oder Quartalsansicht: Kalender-Grid
  const firstDayOfWeek = calendarDays[0]?.getDay() || 0
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Montag = 0
  
  // Für Quartalsansicht: Gruppiere Tage nach Monaten
  const isQuarterView = viewMode === "quarter"
  
  if (isQuarterView) {
    // Gruppiere Tage nach Monaten
    const daysByMonth = new Map<number, Date[]>()
    calendarDays.forEach(day => {
      const month = day.getMonth()
      if (!daysByMonth.has(month)) {
        daysByMonth.set(month, [])
      }
      daysByMonth.get(month)!.push(day)
    })
    
    const months = Array.from(daysByMonth.keys()).sort()
    
    return (
      <div className="space-y-6">
        {months.map(month => {
          const monthDays = daysByMonth.get(month) || []
          const monthName = new Date(currentDate.getFullYear(), month, 1).toLocaleDateString('de-DE', { month: 'long' })
          const firstDayOfMonth = monthDays[0]?.getDay() || 0
          const adjustedFirstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
          
          return (
            <div key={month} className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {monthName} {currentDate.getFullYear()}
              </h3>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: adjustedFirstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${month}-${i}`} className="aspect-square" />
                ))}
                
                {monthDays.map((day, idx) => {
                  const dayKey = day.toISOString().split('T')[0]
                  const dayDates = datesByDay.get(dayKey) || []
                  const isToday = dayKey === new Date().toISOString().split('T')[0]
                  
                  return (
                    <div
                      key={`${month}-${idx}`}
                      className={`
                        aspect-square border rounded p-1 text-xs
                        ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                        ${dayDates.length > 0 ? 'border-green-300 bg-green-50' : ''}
                      `}
                    >
                      <div className="font-medium mb-1">{day.getDate()}</div>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayDates.slice(0, 2).map(date => (
                          <div
                            key={date.id}
                            className="text-[10px] p-0.5 bg-blue-500 text-white rounded truncate"
                            title={date.trip_title}
                          >
                            {date.trip_title.substring(0, 15)}...
                          </div>
                        ))}
                        {dayDates.length > 2 && (
                          <div className="text-[10px] text-gray-600">
                            +{dayDates.length - 2} weitere
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: adjustedFirstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {calendarDays.map((day, idx) => {
          const dayKey = day.toISOString().split('T')[0]
          const dayDates = datesByDay.get(dayKey) || []
          const isToday = dayKey === new Date().toISOString().split('T')[0]
          
          return (
            <div
              key={idx}
              className={`
                aspect-square border rounded p-1 text-xs
                ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}
                ${dayDates.length > 0 ? 'border-green-300 bg-green-50' : ''}
              `}
            >
              <div className="font-medium mb-1">{day.getDate()}</div>
              <div className="space-y-0.5 overflow-hidden">
                {dayDates.slice(0, 2).map(date => (
                  <div
                    key={date.id}
                    className="text-[10px] p-0.5 bg-blue-500 text-white rounded truncate"
                    title={date.trip_title}
                  >
                    {date.trip_title.substring(0, 15)}...
                  </div>
                ))}
                {dayDates.length > 2 && (
                  <div className="text-[10px] text-gray-600">
                    +{dayDates.length - 2} weitere
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

