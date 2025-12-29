"use client"

import { useState } from 'react'
import { MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContactCTAProps {
  source?: string
  className?: string
}

export function ContactCTA({ source = 'unknown', className = '' }: ContactCTAProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/leads/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
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
          subject: '',
          message: '',
        })
        setTimeout(() => setSuccess(false), 5000)
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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
          </div>
          <CardTitle>Kontakt aufnehmen</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nachricht gesendet!</h3>
            <p className="text-gray-600 text-sm">
              Wir melden uns schnellstmöglich bei dir zurück.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
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
                <Label htmlFor="email">E-Mail *</Label>
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

            <div>
              <Label htmlFor="phone">Telefon (optional)</Label>
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
              <Label htmlFor="subject">Betreff *</Label>
              <Input
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="z.B. Allgemeine Anfrage"
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">Nachricht *</Label>
              <Textarea
                id="message"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Wie können wir dir helfen?"
                rows={5}
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
                  Nachricht senden
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

