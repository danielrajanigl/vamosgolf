"use client"

import { useState } from 'react'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface NewsletterCTAProps {
  variant?: 'default' | 'inline' | 'minimal'
  source?: string
  className?: string
}

export function NewsletterCTA({ variant = 'default', source = 'unknown', className = '' }: NewsletterCTAProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/leads/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: name || null,
          source,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEmail('')
        setName('')
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(result.error || 'Fehler beim Anmelden')
      }
    } catch (err) {
      setError('Fehler beim Anmelden. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
          disabled={loading || success}
        />
        <Button type="submit" disabled={loading || success} size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            'Anmelden'
          )}
        </Button>
      </form>
    )
  }

  if (variant === 'inline') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Newsletter abonnieren</h3>
              <p className="text-sm text-gray-600 mb-4">
                Erhalte exklusive Angebote und Neuigkeiten zu unseren Golfreisen
              </p>
            </div>
            
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || success}
              />
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="E-Mail-Adresse *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || success}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || success}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    'Anmelden'
                  )}
                </Button>
              </div>
            </div>

            {success && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Erfolgreich angemeldet! Prüfe dein E-Mail-Postfach.
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
          </form>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Mail className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl mb-2">Newsletter abonnieren</h3>
            <p className="text-emerald-100 mb-4 text-sm">
              Erhalte exklusive Angebote, Frühbucher-Rabatte und Neuigkeiten zu unseren Premium Golfreisen
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Deine E-Mail-Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || success}
                  className="flex-1 bg-white/90 text-gray-900 placeholder:text-gray-500"
                />
                <Button 
                  type="submit" 
                  disabled={loading || success}
                  className="bg-white text-emerald-600 hover:bg-emerald-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    'Jetzt anmelden'
                  )}
                </Button>
              </div>

              {success && (
                <div className="text-sm text-emerald-50 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Erfolgreich angemeldet! Prüfe dein E-Mail-Postfach.
                </div>
              )}

              {error && (
                <div className="text-sm text-red-200">{error}</div>
              )}

              <p className="text-xs text-emerald-100">
                Keine Spam-Mails. Jederzeit abmeldbar.
              </p>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

