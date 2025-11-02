"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewTripDatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    min_participants: 8,
    max_participants: 16,
    base_price_cents: 129900,
    status: 'confirmed',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/trip-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: params.id,
          ...formData,
        }),
      })

      if (res.ok) {
        router.push(`/dashboard/reisen/${params.id}/termine`)
      } else {
        alert('Fehler beim Erstellen des Termins')
      }
    } catch (error) {
      alert('Fehler beim Erstellen des Termins')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Neuer Termin</h1>
        <p className="text-gray-600">Lege einen neuen Reisetermin an</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Startdatum *</Label>
            <Input
              id="start_date"
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="end_date">Enddatum *</Label>
            <Input
              id="end_date"
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_participants">Minimale Teilnehmer *</Label>
            <Input
              id="min_participants"
              type="number"
              min="1"
              required
              value={formData.min_participants}
              onChange={(e) => setFormData({ ...formData, min_participants: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Ab dieser Zahl ist die Reise garantiert</p>
          </div>

          <div>
            <Label htmlFor="max_participants">Maximale Teilnehmer *</Label>
            <Input
              id="max_participants"
              type="number"
              min="1"
              required
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Maximale Kapazität</p>
          </div>
        </div>

        <div>
          <Label htmlFor="base_price_cents">Basispreis (in Cent) *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="base_price_cents"
              type="number"
              min="0"
              step="100"
              required
              value={formData.base_price_cents}
              onChange={(e) => setFormData({ ...formData, base_price_cents: parseInt(e.target.value) })}
            />
            <span className="text-sm text-gray-600">
              = {(formData.base_price_cents / 100).toFixed(2)}€
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Erstelle...' : 'Termin erstellen'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  )
}
