"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function TripGeneralPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [trip, setTrip] = useState<any>(null)

  useEffect(() => {
    fetchTrip()
  }, [])

  async function fetchTrip() {
    const res = await fetch(`/api/trips/${params.id}`)
    const data = await res.json()
    setTrip(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/trips/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      })

      if (res.ok) {
        alert('Gespeichert!')
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (error) {
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  if (!trip) return <div>Lädt...</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-bold">Allgemeine Informationen</h2>

        <div>
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            required
            value={trip.title || ''}
            onChange={(e) => setTrip({ ...trip, title: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="destination">Destination *</Label>
          <Input
            id="destination"
            required
            placeholder="z.B. Algarve, Portugal"
            value={trip.destination || ''}
            onChange={(e) => setTrip({ ...trip, destination: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="Kurze Beschreibung der Reise..."
            value={trip.description || ''}
            onChange={(e) => setTrip({ ...trip, description: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="highlights">Highlights</Label>
          <Textarea
            id="highlights"
            rows={6}
            placeholder="Ein Highlight pro Zeile..."
            value={trip.highlights?.join('\n') || ''}
            onChange={(e) => setTrip({ ...trip, highlights: e.target.value.split('\n').filter(Boolean) })}
          />
          <p className="text-xs text-gray-500 mt-1">Ein Highlight pro Zeile</p>
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
                value={trip.base_price_cents || 0}
                onChange={(e) => setTrip({ ...trip, base_price_cents: parseInt(e.target.value) })}
              />
              <span className="text-sm text-gray-600">
                = {((trip.base_price_cents || 0) / 100).toFixed(2)}€
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full border rounded-md p-2"
              value={trip.status || 'draft'}
              onChange={(e) => setTrip({ ...trip, status: e.target.value })}
            >
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="image_url">Bild URL</Label>
          <Input
            id="image_url"
            type="url"
            placeholder="https://..."
            value={trip.image_url || ''}
            onChange={(e) => setTrip({ ...trip, image_url: e.target.value })}
          />
        </div>

        {trip.image_url && (
          <div>
            <Label>Vorschau</Label>
            <img 
              src={trip.image_url} 
              alt="Preview" 
              className="w-full max-w-md rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Speichere...' : 'Änderungen speichern'}
        </Button>
      </div>
    </form>
  )
}
