"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type StripePriceOption = {
  id: string
  stripe_price_id: string
  unit_amount: number
  currency: string
  nickname?: string | null
}

type StripeProductOption = {
  id: string
  title: string
  slug: string
  stripe_product_id: string
  prices: StripePriceOption[]
}

export default function TripEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = searchParams.get('id')
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    destination: '',
    description: '',
    highlights: [] as string[],
    base_price_cents: 129900,
    status: 'draft',
    image_url: '',
    currency: 'EUR',
    product_id: '' as string | undefined,
    stripe_product_id: '' as string | undefined,
    stripe_price_id: '' as string | undefined,
    min_participants: 4,
    max_participants: 12,
  })

  const [products, setProducts] = useState<StripeProductOption[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
    if (tripId) {
      fetchTrip()
    }
  }, [tripId])

  async function fetchProducts() {
    try {
      setProductsLoading(true)
      const res = await fetch('/api/dashboard/products?type=reise')
      if (!res.ok) {
        throw new Error('Produkte konnten nicht geladen werden')
      }
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error(error)
    } finally {
      setProductsLoading(false)
    }
  }

  async function fetchTrip() {
    const res = await fetch(`/api/trips/${tripId}`)
    const data = await res.json()
    const normalized = {
      title: typeof data.title === 'object' ? (data.title.de || data.title.en || Object.values(data.title)[0] || '') : (data.title || ''),
      slug: data.slug || '',
      destination: data.destination || '',
      description: typeof data.description === 'object' ? (data.description.de || data.description.en || Object.values(data.description)[0] || '') : (data.description || ''),
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      base_price_cents: Number.isFinite(data.base_price_cents) ? data.base_price_cents : 0,
      status: data.status || 'draft',
      image_url: data.image_url || '',
      currency: data.currency || 'EUR',
      product_id: data.product_id || '',
      stripe_product_id: data.stripe_product_id || '',
      stripe_price_id: data.stripe_price_id || '',
      min_participants: Number.isFinite(data.min_participants) ? data.min_participants : 1,
      max_participants: Number.isFinite(data.max_participants) ? data.max_participants : Math.max(1, data.min_participants || 1),
    }
    setFormData(normalized)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = tripId ? `/api/trips/${tripId}` : '/api/trips'
      const method = tripId ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        slug: formData.slug.trim(),
        title: { de: formData.title },
        description: { de: formData.description },
        highlights: formData.highlights,
        product_id: formData.product_id || null,
        stripe_product_id: formData.stripe_product_id || null,
        stripe_price_id: formData.stripe_price_id || null,
        currency: (formData.currency || 'EUR').toUpperCase(),
        min_participants: Number(formData.min_participants) || 1,
        max_participants: Math.max(Number(formData.min_participants) || 1, Number(formData.max_participants) || 1),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              required
              placeholder="winter-golfreise-huelva-andalusien-suedspanien"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
            />
            <p className="text-sm text-gray-500 mt-1">
              Wird für URLs und Stripe-Metadaten verwendet. Nur Kleinbuchstaben, Zahlen und Bindestriche.
            </p>
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
                highlights: e.target.value.split('\n').map((h) => h.trim()).filter(Boolean)
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price_cents">Fallback-Basispreis (Cent)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="base_price_cents"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.base_price_cents}
                  onChange={(e) => setFormData({ ...formData, base_price_cents: parseInt(e.target.value) || 0 })}
                />
                <span className="text-sm text-gray-600">
                  = {(formData.base_price_cents / 100).toFixed(2)}€
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Wird nur genutzt, falls kein Stripe-Preis gefunden wird.
              </p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_participants">Min. Teilnehmer</Label>
              <Input
                id="min_participants"
                type="number"
                min="1"
                value={formData.min_participants}
                onChange={(e) => setFormData({ ...formData, min_participants: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </div>
            <div>
              <Label htmlFor="max_participants">Max. Teilnehmer</Label>
              <Input
                id="max_participants"
                type="number"
                min={formData.min_participants || 1}
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: Math.max(formData.min_participants || 1, parseInt(e.target.value) || formData.min_participants || 1) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Stripe Produkt</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.product_id || ''}
                onChange={(e) => {
                  const product = products.find((p) => p.id === e.target.value)
                  setFormData((prev) => ({
                    ...prev,
                    product_id: e.target.value || undefined,
                    stripe_product_id: product?.stripe_product_id,
                    stripe_price_id: product?.prices?.[0]?.stripe_price_id,
                  }))
                }}
              >
                <option value="">Stripe Produkt auswählen…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} ({product.slug})
                  </option>
                ))}
              </select>
              {productsLoading && (
                <p className="text-xs text-gray-500 mt-1">Stripe-Produkte werden geladen…</p>
              )}
            </div>

            <div>
              <Label>Stripe Preis</Label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.stripe_price_id || ''}
                onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value || undefined })}
                disabled={!formData.product_id}
              >
                <option value="">
                  {formData.product_id ? 'Stripe Preis auswählen…' : 'Zuerst Produkt wählen'}
                </option>
                {products
                  .find((p) => p.id === formData.product_id)?.prices
                  ?.map((price) => (
                    <option key={price.id} value={price.stripe_price_id}>
                      {price.nickname || price.stripe_price_id} – {(price.unit_amount / 100).toFixed(2)} {price.currency.toUpperCase()}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="rounded-md border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">Hinweis zu Stripe-Add-ons</p>
            <p className="mb-1">
              Verknüpfte Add-ons findest du im Bereich „Add-ons verwalten“. Stelle sicher, dass die Stripe-Produkt- und Preis-IDs bereits in Supabase hinterlegt sind (Sync).
            </p>
            <p>
              Aktuell ausgewählt: <span className="font-mono">{formData.stripe_product_id || '–'}</span> • <span className="font-mono">{formData.stripe_price_id || '–'}</span>
            </p>
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
