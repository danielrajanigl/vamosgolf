"use client"

import { useState } from 'react'
import { Calendar, User, Phone, Mail, MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BookingInquiryCTAProps {
  tripId?: string
  tripDateId?: string
  tripTitle?: string
  className?: string
  source?: string
}

export function BookingInquiryCTA({ 
  tripId, 
  tripDateId, 
  tripTitle,
  className = '',
  source,
}: BookingInquiryCTAProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    persons: 1,
    message: '',
    preferred_contact: 'email' as 'email' | 'phone',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/leads/booking-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          trip_id: tripId,
          trip_date_id: tripDateId,
          source,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          persons: 1,
          message: '',
          preferred_contact: 'email',
        })
        setTimeout(() => setSuccess(false), 8000)
      } else {
        setError(result.error || 'Fehler beim Senden')
      }
    } catch (err) {
      setError('Fehler beim Senden. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`border-emerald-200 ${className}`}>
      <CardHeader className="bg-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          Unverbindliche Anfrage
        </CardTitle>
        {tripTitle && (
          <p className="text-sm text-gray-600 mt-1">{tripTitle}</p>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Anfrage gesendet!</h3>
            <p className="text-gray-600 text-sm mb-4">
              Wir melden uns schnellstmöglich bei dir zurück und besprechen alle Details.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setSuccess(false)}
              size="sm"
            >
              Neue Anfrage
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-Mail *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="persons">Anzahl Personen *</Label>
                <Input
                  id="persons"
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formData.persons}
                  onChange={(e) => setFormData({ ...formData, persons: parseInt(e.target.value) || 1 })}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferred_contact">Bevorzugte Kontaktmethode</Label>
              <select
                id="preferred_contact"
                value={formData.preferred_contact}
                onChange={(e) => setFormData({ ...formData, preferred_contact: e.target.value as 'email' | 'phone' })}
                disabled={loading}
                className="w-full mt-1 border rounded-md p-2"
              >
                <option value="email">E-Mail</option>
                <option value="phone">Telefon</option>
              </select>
            </div>

            <div>
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Nachricht (optional)
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Hast du spezielle Wünsche oder Fragen?"
                rows={4}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Unverbindliche Anfrage senden
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Unverbindlich und kostenfrei. Wir melden uns innerhalb von 24h.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

