"use client"

import { useState } from 'react'
import { 
  Calendar, 
  Users, 
  CreditCard,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TripBookingFormProps {
  trip: any
  dates: any[]
  packages: any[]
  basePrice: number
}

export function TripBookingForm({ trip, dates, packages, basePrice }: TripBookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<string>(dates.length > 0 ? dates[0].id : '')
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set())
  const [persons, setPersons] = useState(1)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const selectedDateData = dates.find((d: any) => d.id === selectedDate)
  const selectedPackagesData = packages.filter((p: any) => selectedPackages.has(p.id))
  
  const packageTotal = selectedPackagesData.reduce((sum: number, p: any) => sum + ((p.price_delta_cents || 0) / 100), 0)
  const totalPrice = basePrice + packageTotal
  const totalForPersons = totalPrice * persons

  async function handleCheckout() {
    if (!selectedDate) return
    if (!trip.stripe_price_id) {
      alert("Diese Reise ist noch nicht für Stripe konfiguriert. Bitte kontaktiere das VamosGolf Team.")
      return
    }

    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          trip_date_id: selectedDate,
          persons: persons,
          package_ids: Array.from(selectedPackages),
        })
      })

      const result = await response.json()
      
      if (result.url) {
        window.location.href = result.url
      } else {
        alert(result.error || 'Fehler beim Checkout')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Fehler beim Checkout')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <Card className="border border-gray-100 shadow-lg sticky top-8 bg-white">
      <CardHeader className="bg-gradient-to-br from-sky-50 to-blue-50 border-b border-gray-100">
        <CardTitle className="text-2xl text-gray-900">Jetzt buchen</CardTitle>
        <div className="text-3xl font-bold mt-2 text-sky-600">
          {basePrice.toFixed(2)} <span className="text-lg font-normal text-gray-600">€</span>
          <span className="text-sm font-normal ml-2 text-gray-600">pro Person</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Termin Auswahl */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            <Calendar className="inline h-4 w-4 mr-2" />
            Termin auswählen
          </Label>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dates.map((date: any) => {
                const start = new Date(date.start_date)
                const end = new Date(date.end_date)
                const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                const available = date.max_participants - date.current_bookings
                const isFull = available === 0

                return (
                  <SelectItem 
                    key={date.id} 
                    value={date.id}
                    disabled={isFull}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">
                          {start.toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })} - {end.toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {duration} Tage · {available > 0 ? `${available} Plätze frei` : 'Ausgebucht'}
                        </div>
                      </div>
                      {isFull && (
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700">
                          Ausgebucht
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {selectedDateData && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Verfügbare Plätze:</span>
                <span className="font-semibold">
                  {selectedDateData.max_participants - selectedDateData.current_bookings} / {selectedDateData.max_participants}
                </span>
              </div>
              {selectedDateData.min_participants > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Mindestanzahl: {selectedDateData.min_participants}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Personen */}
        <div>
          <Label className="text-base font-semibold mb-3 block">
            <Users className="inline h-4 w-4 mr-2" />
            Anzahl Personen
          </Label>
          <Input
            type="number"
            min="1"
            max={selectedDateData ? selectedDateData.max_participants - selectedDateData.current_bookings : 10}
            value={persons}
            onChange={(e) => setPersons(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-12 text-lg"
          />
        </div>

        {/* Packages */}
        {packages.length > 0 && (
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Zusatzpakete (optional)
            </Label>
            <div className="space-y-2">
              {packages.map((pkg: any) => {
                const pkgTitle = pkg.title || ''
                const pkgPrice = ((pkg.price_delta_cents || 0) / 100).toFixed(2)
                const isSelected = selectedPackages.has(pkg.id)

                return (
                  <label
                    key={pkg.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-gray-200 hover:border-sky-300'
                    } ${!pkg.stripe_price_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSet = new Set(selectedPackages)
                        if (e.target.checked) {
                          newSet.add(pkg.id)
                        } else {
                          newSet.delete(pkg.id)
                        }
                        setSelectedPackages(newSet)
                      }}
                      className="w-5 h-5 text-sky-600 rounded"
                      disabled={!pkg.stripe_price_id}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{pkgTitle}</div>
                      {pkg.description && (
                        <div className="text-sm text-gray-500">
                          {pkg.description}
                        </div>
                      )}
                      {pkgPrice !== '0.00' && (
                        <div className="text-sm text-gray-600">
                          +{pkgPrice} € pro Person
                        </div>
                      )}
                      {!pkg.stripe_price_id && (
                        <div className="text-sm text-red-500">
                          Nicht buchbar
                        </div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Preis Zusammenfassung */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Grundpreis ({persons} Person{persons !== 1 ? 'en' : ''})</span>
            <span className="font-medium">{(basePrice * persons).toFixed(2)} €</span>
          </div>
          {selectedPackagesData.length > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Zusatzpakete ({persons} Person{persons !== 1 ? 'en' : ''})</span>
              <span>+{(packageTotal * persons).toFixed(2)} €</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Gesamtpreis</span>
            <span className="text-sky-600">{totalForPersons.toFixed(2)} €</span>
          </div>
          <div className="text-xs text-gray-500">
            inkl. MwSt. · Anzahlung 20%, Rest bei Reisebeginn
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          disabled={!selectedDate || checkoutLoading || !trip.stripe_price_id || (selectedDateData && selectedDateData.max_participants - selectedDateData.current_bookings < persons)}
          className="w-full h-14 text-lg bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-lg"
          size="lg"
        >
          {checkoutLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Wird verarbeitet...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Jetzt sicher buchen
            </>
          )}
        </Button>

        {!trip.stripe_price_id && (
          <div className="text-sm text-red-500 text-center">
            Diese Reise ist aktuell nicht buchbar. Bitte wende dich an das VamosGolf Team.
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
          <Shield className="h-4 w-4" />
          <span>Sichere Zahlung mit Stripe</span>
        </div>
      </CardContent>
    </Card>
  )
}

