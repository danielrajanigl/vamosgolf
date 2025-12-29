"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Search,
  Filter,
  Download
} from "lucide-react"

interface Lead {
  id: string
  email: string
  full_name?: string
  phone?: string
  lead_type: 'newsletter' | 'contact' | 'booking_inquiry' | 'download' | 'callback'
  source?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  created_at: string
  metadata?: any
}

interface Stats {
  total_leads: number
  new_leads: number
  newsletter_subscribers: number
  new_contact_submissions: number
  new_booking_inquiries: number
  leads_by_type: Record<string, number>
  recent_leads_30d: number
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchLeads()
    fetchStats()
  }, [typeFilter, statusFilter])

  async function fetchLeads() {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/leads/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  function getLeadTypeIcon(type: string) {
    switch (type) {
      case 'newsletter':
        return <Mail className="h-4 w-4" />
      case 'contact':
        return <MessageSquare className="h-4 w-4" />
      case 'booking_inquiry':
        return <Calendar className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  function getLeadTypeLabel(type: string) {
    switch (type) {
      case 'newsletter':
        return 'Newsletter'
      case 'contact':
        return 'Kontakt'
      case 'booking_inquiry':
        return 'Buchungsanfrage'
      case 'download':
        return 'Download'
      case 'callback':
        return 'Rückruf'
      default:
        return type
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.full_name && lead.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm))
    
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="text-gray-600 mt-1">Verwalte alle eingehenden Leads</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Gesamt Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_leads}</div>
              <div className="text-xs text-gray-500 mt-1">{stats.recent_leads_30d} in den letzten 30 Tagen</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Neue Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats.new_leads}</div>
              <div className="text-xs text-gray-500 mt-1">Noch nicht bearbeitet</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.newsletter_subscribers}</div>
              <div className="text-xs text-gray-500 mt-1">Aktive Abonnenten</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Buchungsanfragen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.new_booking_inquiries}</div>
              <div className="text-xs text-gray-500 mt-1">Unbearbeitet</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Suche nach E-Mail, Name oder Telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="contact">Kontakt</SelectItem>
                <SelectItem value="booking_inquiry">Buchungsanfrage</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="new">Neu</SelectItem>
                <SelectItem value="contacted">Kontaktiert</SelectItem>
                <SelectItem value="qualified">Qualifiziert</SelectItem>
                <SelectItem value="converted">Konvertiert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Keine Leads gefunden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Quelle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLeadTypeIcon(lead.lead_type)}
                        <span className="text-sm">{getLeadTypeLabel(lead.lead_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.full_name || '-'}
                    </TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.source || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.status === 'new'
                            ? 'default'
                            : lead.status === 'converted'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {lead.status === 'new' && 'Neu'}
                        {lead.status === 'contacted' && 'Kontaktiert'}
                        {lead.status === 'qualified' && 'Qualifiziert'}
                        {lead.status === 'converted' && 'Konvertiert'}
                        {lead.status === 'lost' && 'Verloren'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

