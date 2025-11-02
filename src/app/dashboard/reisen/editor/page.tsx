"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function TripEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams.get('id')
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    highlights: [] as string[],
    base_price_cents: 129900,
    status: 'draft',
    image_url: '',
  })

  useEffect(() => {
    if (tripId) {
      fetchTrip()
    }
  }, [tripId])

  async function fetchTrip() {
    const res = await fetch(`/api/trips/${tripId}`)
    const data = await res.json()
    setFormData(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = tripId ? `/api/trips/${tripId}` : '/api/trips'
      const method = tripId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/dashboard/reisen')
      } else {
        const error = await res.json()
        alert('Fehler: ' + (error.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {tripId ? 'Reise bearbeiten' : 'Neue Reise erstellen'}
        </h1>
        <p className="text-gray-600">Grundlegende Informationen zur Golfreise</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              required
              placeholder="z.B. Portugal Algarve Golf"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="destination">Destination *</Label>
            <Input
              id="destination"
              required
              placeholder="z.B. Algarve, Portugal"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Kurze Beschreibung der Reise..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="highlights">Highlights (eins pro Zeile)</Label>
            <Textarea
              id="highlights"
              rows={6}
              placeholder="Top Golfplätze&#10;Luxushotel am Strand&#10;Professionelles Coaching"
              value={formData.highlights.join('\n')}
              onChange={(e) => setFormData({ 
                ...formData, 
                highlights: e.target.value.split('\n').filter(h => h.trim()) 
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price_cents">Basispreis (Cent)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="base_price_cents"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.base_price_cents}
                  onChange={(e) => setFormData({ ...formData, base_price_cents: parseInt(e.target.value) })}
                />
                <span className="text-sm text-gray-600">
                  = {(formData.base_price_cents / 100).toFixed(2)}€
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full border rounded-md p-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">Bild URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          {formData.image_url && (
            <div>
              <Label>Vorschau</Label>
              <img 
                src={formData.image_url} 
                alt="Preview" 
                className="w-full max-w-md rounded-lg mt-2"
                onError={() => alert('Bild konnte nicht geladen werden')}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Speichere...' : tripId ? 'Änderungen speichern' : 'Reise erstellen'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push('/dashboard/reisen')}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  )
}
