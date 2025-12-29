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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  Download, 
  Filter, 
  CheckSquare, 
  Square, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Mail, 
  Shield, 
  Calendar,
  UserPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCog
} from "lucide-react"

interface User {
  id: string
  email: string
  email_confirmed: boolean
  email_confirmed_at: string | null
  created_at: string
  last_sign_in_at: string | null
  phone: string | null
  phone_confirmed: boolean
  role: string
  full_name: string | null
  profile_created_at: string | null
}

const ITEMS_PER_PAGE = 20

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<"email" | "created_at" | "last_sign_in_at" | "role">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Nutzer")
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateUser(userId: string, updates: any) {
    try {
      setUpdating(true)
      console.log("Updating user:", userId, "with updates:", updates)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("API error:", error)
        console.error("Response status:", response.status)
        console.error("Error details:", error.details)
        throw new Error(error.error || error.message || "Fehler beim Aktualisieren")
      }

      const result = await response.json()
      console.log("Update successful:", result)

      // Aktualisiere den User direkt in der Liste mit den zurückgegebenen Daten
      if (result.user) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  email_confirmed: result.user.email_confirmed,
                  email_confirmed_at: result.user.email_confirmed_at,
                  role: result.user.role,
                  full_name: result.user.full_name,
                }
              : user
          )
        )
      }

      // Warte etwas und lade dann komplett neu für Konsistenz
      await new Promise(resolve => setTimeout(resolve, 300))
      await fetchUsers()
      
      setEditDialogOpen(false)
      setSelectedUser(null)
      setSelectedUsers(new Set())
    } catch (error: any) {
      console.error("Error updating user:", error)
      alert(error.message || "Fehler beim Aktualisieren des Nutzers")
    } finally {
      setUpdating(false)
    }
  }

  async function handleBulkUpdate(updates: any) {
    try {
      setUpdating(true)
      const promises = Array.from(selectedUsers).map(userId => 
        fetch(`/api/admin/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
      )
      
      await Promise.all(promises)
      await fetchUsers()
      setSelectedUsers(new Set())
    } catch (error: any) {
      console.error("Error bulk updating:", error)
      alert("Fehler beim Aktualisieren der Nutzer")
    } finally {
      setUpdating(false)
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Löschen")
      }

      await fetchUsers()
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      setSelectedUsers(new Set())
    } catch (error: any) {
      console.error("Error deleting user:", error)
      alert(error.message || "Fehler beim Löschen des Nutzers")
    } finally {
      setUpdating(false)
    }
  }

  function toggleSelectAll() {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.id)))
    }
  }

  function toggleSelectUser(userId: string) {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  function exportToCSV() {
    const headers = ["Email", "Name", "Rolle", "Status", "Registriert", "Letzter Login"]
    const rows = filteredUsers.map(user => [
      user.email,
      user.full_name || "",
      user.role,
      user.email_confirmed_at ? "Verifiziert" : "Unverifiziert",
      new Date(user.created_at).toLocaleDateString('de-DE'),
      user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('de-DE') : "Nie"
    ])

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nutzer-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Filter und Sortierung
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "verified" && user.email_confirmed_at !== null) ||
        (statusFilter === "unverified" && !user.email_confirmed_at)

      return matchesSearch && matchesRole && matchesStatus
    })

    // Sortierung
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy]
      let bVal: any = b[sortBy]

      if (sortBy === "created_at" || sortBy === "last_sign_in_at") {
        aVal = new Date(aVal || 0).getTime()
        bVal = new Date(bVal || 0).getTime()
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = useMemo(() => ({
    total: users.length,
    clients: users.filter(u => u.role === 'client').length,
    editors: users.filter(u => u.role === 'editor').length,
    admins: users.filter(u => u.role === 'admin').length,
    unverified: users.filter(u => !u.email_confirmed_at).length,
    verified: users.filter(u => u.email_confirmed_at !== null).length,
    active: users.filter(u => u.last_sign_in_at).length,
  }), [users])

  function handleSort(column: typeof sortBy) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Lade Nutzer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-gray-600 mt-2">
            Verwalte alle Nutzer, verifiziere Emails und ändere Rollen
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gesamt
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Verifiziert
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.verified}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Unverifiziert
            </CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.unverified}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Aktiv
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rollen-Statistiken */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-2xl">{stats.clients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Editoren</CardDescription>
            <CardTitle className="text-2xl">{stats.editors}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-2xl">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter und Suche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Suche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Suche nach Email oder Name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(v) => {
              setRoleFilter(v)
              setCurrentPage(1)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => {
              setStatusFilter(v)
              setCurrentPage(1)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="verified">Verifiziert</SelectItem>
                <SelectItem value="unverified">Unverifiziert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.size} Nutzer ausgewählt
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate({ email_confirm: true })}
                  disabled={updating}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Emails verifizieren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdate({ role: "client" })}
                  disabled={updating}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Zu Client ändern
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nutzer-Tabelle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alle Nutzer ({filteredAndSortedUsers.length})</CardTitle>
          <Badge variant="outline">
            Seite {currentPage} von {totalPages}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center"
                    >
                      {selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Email
                      {sortBy === "email" && (
                        <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("role")}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Rolle
                      {sortBy === "role" && (
                        <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      <Calendar className="h-4 w-4" />
                      Registriert
                      {sortBy === "created_at" && (
                        <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("last_sign_in_at")}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Letzter Login
                      {sortBy === "last_sign_in_at" && (
                        <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">Keine Nutzer gefunden</p>
                      <p className="text-sm mt-1">Versuche andere Filtereinstellungen</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <button
                          onClick={() => toggleSelectUser(user.id)}
                          className="flex items-center justify-center"
                        >
                          {selectedUsers.has(user.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{user.full_name || <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Prüfe korrekt: email_confirmed_at muss vorhanden sein */}
                          {user.email_confirmed_at ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verifiziert
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverifiziert
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (confirm(`Möchtest du die Email für ${user.email} manuell verifizieren? Der Nutzer kann danach einloggen.`)) {
                                    await handleUpdateUser(user.id, { email_confirm: true })
                                  }
                                }}
                                disabled={updating}
                                className="text-xs h-7 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                                title="Email manuell verifizieren - ermöglicht Login"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Verifizieren
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : <span className="text-gray-400">Nie</span>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleUpdateUser(user.id, { role: newRole })}
                            disabled={updating}
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user)
                              setEditDialogOpen(true)
                            }}
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteDialogOpen(true)
                            }}
                            title="Löschen"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Zeige {(currentPage - 1) * ITEMS_PER_PAGE + 1} bis {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedUsers.length)} von {filteredAndSortedUsers.length} Nutzern
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Zurück
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Weiter
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bearbeiten Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite Details für {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserEditForm
              user={selectedUser}
              onSave={(updates) => {
                handleUpdateUser(selectedUser.id, updates)
              }}
              onCancel={() => {
                setEditDialogOpen(false)
                setSelectedUser(null)
              }}
              updating={updating}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Löschen Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Nutzer löschen
            </DialogTitle>
            <DialogDescription>
              Bist du sicher, dass du <strong>{selectedUser?.email}</strong> löschen möchtest?
              <br />
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedUser(null)
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
              disabled={updating}
            >
              {updating ? "Löschen..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserEditForm({
  user,
  onSave,
  onCancel,
  updating,
}: {
  user: User
  onSave: (updates: any) => void
  onCancel: () => void
  updating: boolean
}) {
  const [fullName, setFullName] = useState(user.full_name || "")
  const [role, setRole] = useState(user.role)
  const [emailConfirm, setEmailConfirm] = useState(user.email_confirmed)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const updates: any = {}
    
    // Normalisiere für Vergleich: null und "" sind gleich
    const currentName = user.full_name || ""
    const newName = fullName.trim()
    
    if (newName !== currentName) {
      updates.full_name = newName || null
    }
    
    if (role !== user.role) {
      updates.role = role
    }
    
    if (emailConfirm && !user.email_confirmed) {
      updates.email_confirm = true
    }

    // Wenn keine Updates, nichts tun
    if (Object.keys(updates).length === 0) {
      return
    }

    onSave(updates)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} disabled className="bg-gray-50" />
        <p className="text-xs text-gray-500 mt-1">Email kann nicht geändert werden</p>
      </div>

      <div>
        <Label htmlFor="fullName">Vollständiger Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Max Mustermann"
        />
      </div>

      <div>
        <Label htmlFor="role">Rolle</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="emailConfirm"
          checked={emailConfirm}
          onChange={(e) => setEmailConfirm(e.target.checked)}
          disabled={user.email_confirmed}
          className="rounded"
        />
        <Label htmlFor="emailConfirm" className="cursor-pointer flex-1">
          Email verifiziert
          {user.email_confirmed && (
            <span className="text-xs text-gray-500 ml-2">(bereits verifiziert)</span>
          )}
        </Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={updating}>
          {updating ? "Speichern..." : "Speichern"}
        </Button>
      </DialogFooter>
    </form>
  )
}
