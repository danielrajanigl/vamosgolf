"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function TripAddonsPage({ params }: { params: { id: string } }) {
  const [addons, setAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: 0,
    max_quantity: 10,
  })

  useEffect(() => {
    fetchAddons()
  }, [])

  async function fetchAddons() {
    const res = await fetch(`/api/trips/${params.id}/addons`)
    const data = await res.json()
    setAddons(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/trips/${params.id}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', description: '', price_cents: 0, max_quantity: 10 })
        fetchAddons()
      } else {
        alert('Fehler beim Erstellen')
      }
    } catch (error) {
      alert('Fehler beim Erstellen')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(addonId: string, active: boolean) {
    try {
      await fetch(`/api/trips/${params.id}/addons/${addonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      fetchAddons()
    } catch (error) {
      alert('Fehler beim Aktualisieren')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Add-ons & Zusatzprodukte</h2>
          <p className="text-gray-600">Verwalte buchbare Zusatzleistungen</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Neues Add-on</Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-bold text-lg">Neues Add-on erstellen</h3>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              placeholder="z.B. Golfschläger-Leihset"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Details zum Add-on..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_cents">Preis (Cent) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="price_cents"
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) })}
                />
                <span className="text-sm text-gray-600">
                  = {(formData.price_cents / 100).toFixed(2)}€
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="max_quantity">Max. Menge</Label>
              <Input
                id="max_quantity"
                type="number"
                min="1"
                value={formData.max_quantity}
                onChange={(e) => setFormData({ ...formData, max_quantity: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Erstelle...' : 'Add-on erstellen'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-4">Name</th>
              <th className="p-4">Beschreibung</th>
              <th className="p-4">Preis</th>
              <th className="p-4">Max. Menge</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {addons.map((addon) => (
              <tr key={addon.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{addon.name}</td>
                <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                  {addon.description || '-'}
                </td>
                <td className="p-4">{(addon.price_cents / 100).toFixed(2)}€</td>
                <td className="p-4">{addon.max_quantity}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    addon.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {addon.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(addon.id, addon.active)}
                  >
                    {addon.active ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {addons.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Noch keine Add-ons erstellt. Erstelle dein erstes Zusatzprodukt!
          </div>
        )}
      </div>
    </div>
  )
}
