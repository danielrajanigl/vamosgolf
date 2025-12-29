"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface StripeAddonOption {
  product_id: string
  stripe_product_id: string
  product_title: string
  product_slug: string
  stripe_price_id: string
  unit_amount: number
  currency: string
  nickname?: string | null
}

interface TripAddon {
  id: string
  title: string
  description: string
  stripe_price_id: string
  price_delta_cents: number
  is_active: boolean
  product?: {
    title?: string
    slug?: string
    stripe_product_id?: string
  } | null
  price?: {
    stripe_price_id: string
    unit_amount: number
    currency: string
    nickname?: string | null
  } | null
}

export default function TripAddonsPage({ params }: { params: { id: string } }) {
  const [tripSlug, setTripSlug] = useState<string>('')
  const [addons, setAddons] = useState<TripAddon[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAddons, setLoadingAddons] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [priceOptions, setPriceOptions] = useState<StripeAddonOption[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    stripe_price_id: '',
    title: '',
    description: '',
  })

  useEffect(() => {
    loadTrip()
  }, [params.id])

  async function loadTrip() {
    try {
      const res = await fetch(`/api/trips/${params.id}`)
      const trip = await res.json()
      if (trip?.slug) {
        setTripSlug(trip.slug)
        fetchStripeOptions(trip.slug)
      }
      fetchAddons()
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchStripeOptions(parentSlug: string) {
    try {
      const res = await fetch(`/api/dashboard/products?type=addon&parent_slug=${parentSlug}`)
      const products = await res.json()
      const options: StripeAddonOption[] = (products || []).flatMap((product: any) =>
        (product.prices || []).map((price: any) => ({
          product_id: product.id,
          stripe_product_id: product.stripe_product_id,
          product_title: product.title,
          product_slug: product.slug,
          stripe_price_id: price.stripe_price_id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          nickname: price.nickname,
        }))
      )
      setPriceOptions(options)
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchAddons() {
    try {
      setLoadingAddons(true)
      const res = await fetch(`/api/trips/${params.id}/addons`)
      const data = await res.json()
      setAddons(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingAddons(false)
    }
  }

  const selectedPrice = useMemo(() => (
    priceOptions.find((option) => option.stripe_price_id === formData.stripe_price_id)
  ), [formData.stripe_price_id, priceOptions])

  function resetForm() {
    setFormData({ stripe_price_id: '', title: '', description: '' })
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.stripe_price_id) {
      setFormError('Bitte wähle zuerst einen Stripe-Preis aus.')
      return
    }

    setLoading(true)
    setFormError(null)

    try {
      const res = await fetch(`/api/trips/${params.id}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowForm(false)
        resetForm()
        fetchAddons()
      } else {
        const error = await res.json()
        setFormError(error.error || 'Fehler beim Erstellen')
      }
    } catch (error) {
      setFormError('Fehler beim Erstellen. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(addonId: string, isActive: boolean) {
    try {
      await fetch(`/api/trips/${params.id}/addons/${addonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
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
          <p className="text-gray-600">Verknüpfe Stripe-Add-ons mit dieser Reise.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} disabled={!tripSlug}>
            + Neues Add-on
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-bold text-lg">Stripe Add-on verknüpfen</h3>

          <div>
            <Label htmlFor="stripe_price">Stripe Preis *</Label>
            <select
              id="stripe_price"
              className="w-full border rounded-md p-2 mt-1"
              value={formData.stripe_price_id}
              onChange={(e) => {
                const value = e.target.value
                const priceOption = priceOptions.find((option) => option.stripe_price_id === value)
                setFormData((prev) => ({
                  ...prev,
                  stripe_price_id: value,
                  title: prev.title || priceOption?.nickname || priceOption?.product_title || '',
                }))
              }}
            >
              <option value="">Stripe Preis auswählen…</option>
              {priceOptions.map((option) => (
                <option key={option.stripe_price_id} value={option.stripe_price_id}>
                  {option.product_title} • {(option.unit_amount / 100).toFixed(2)} {option.currency.toUpperCase()} {option.nickname ? `(${option.nickname})` : ''}
                </option>
              ))}
            </select>
            {!priceOptions.length && (
              <p className="text-xs text-amber-600 mt-2">
                Keine Stripe Add-on-Produkte für diesen Trip gefunden. Bitte prüfe, ob die Produkte im Testmodus das Metadatum <code>parent_product</code> = {tripSlug || '…'} besitzen.
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                placeholder="z.B. Weintour – Gourmet Experience"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Preis Vorschau</Label>
              <p className="mt-2 text-sm text-gray-600">
                {selectedPrice
                  ? `${(selectedPrice.unit_amount / 100).toFixed(2)} ${selectedPrice.currency.toUpperCase()}`
                  : 'Bitte Stripe-Preis auswählen'}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Kurze Beschreibung, die im Shop angezeigt wird."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {formError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Verknüpfe…' : 'Add-on hinzufügen'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="p-4">Titel</th>
              <th className="p-4">Stripe Preis</th>
              <th className="p-4">Preis (Anzeige)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {addons.map((addon) => (
              <tr key={addon.id} className="border-b text-sm">
                <td className="p-4">
                  <div className="font-medium text-gray-900">{addon.title || addon.product?.title || 'Add-on'}</div>
                  <div className="text-gray-500 mt-1">
                    {addon.description || 'Keine Beschreibung hinterlegt'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-mono text-xs text-gray-600">{addon.stripe_price_id}</div>
                  {addon.product?.slug && (
                    <div className="text-xs text-gray-500 mt-1">Produkt: {addon.product.slug}</div>
                  )}
                </td>
                <td className="p-4 font-medium">
                  {(() => {
                    const amount = addon.price?.unit_amount ?? addon.price_delta_cents ?? 0
                    return `${(amount / 100).toFixed(2)} ${(addon.price?.currency || 'EUR').toUpperCase()}`
                  })()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${addon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {addon.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(addon.id, addon.is_active)}
                  >
                    {addon.is_active ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!addons.length && !loadingAddons && (
          <div className="p-8 text-center text-gray-500 text-sm">
            Noch keine Add-ons verknüpft. Erstelle dein erstes Stripe-Add-on!
          </div>
        )}
        {loadingAddons && (
          <div className="p-8 text-center text-gray-500 text-sm">
            Add-ons werden geladen…
          </div>
        )}
      </div>
    </div>
  )
}
