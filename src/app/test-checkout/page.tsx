"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function TestCheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persons: 2,
          package_ids: [],
          amount_cents: 129900,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Keine URL erhalten')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-3xl font-bold">✅ Stripe Webhook Test v3</h1>
        <p className="text-sm text-gray-600">Test ohne Trip IDs</p>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded">
            {error}
          </div>
        )}

        <Button 
          onClick={handleCheckout} 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          {loading ? 'Lädt...' : '💳 Test-Zahlung (1.299€)'}
        </Button>

        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
          <p className="font-semibold mb-2">Testkarte:</p>
          <p>Nummer: 4242 4242 4242 4242</p>
          <p>Datum: 12/25 | CVC: 123</p>
        </div>
      </div>
    </div>
  )
}
