import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    const { trip_id, trip_date_id, persons = 1, package_ids = [] } = await req.json()

    if (!trip_id || !trip_date_id) {
      return NextResponse.json(
        { error: "Trip ID und Termin ID erforderlich" },
        { status: 400 }
      )
    }

    // Get user (or use guest data later)
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    // Hole Trip mit Produkt-/Preisinfos
    const { data: trip, error: tripError } = await supabase
      .from('vamosgolf_trips')
      .select('id, title, slug, image_url, stripe_price_id, product_id, base_price_cents, currency, stripe_product_id')
      .eq('id', trip_id)
      .single()

    if (tripError || !trip) {
      console.error('❌ Trip nicht gefunden:', tripError)
      return NextResponse.json({ error: 'Trip nicht gefunden' }, { status: 404 })
    }

    if (!trip.stripe_price_id) {
      return NextResponse.json({ error: 'Reise ist nicht für Stripe konfiguriert.' }, { status: 400 })
    }

    // Hole Termin-Daten
    const { data: tripDate } = await supabase
      .from('vamosgolf_trip_dates')
      .select('start_date, end_date')
      .eq('id', trip_date_id)
      .single()

    let packageNames: string[] = []
    let packageAmountPerPerson = 0
    let packageStripePriceIds: string[] = []

    if (package_ids && package_ids.length > 0) {
      const { data: packages } = await supabase
        .from('addons')
        .select('id, title, price_delta_cents, stripe_price_id')
        .in('id', package_ids)

      packageNames = (packages || []).map((p: any) => p.title || '')

      packageAmountPerPerson = (packages || []).reduce((sum: number, pkg: any) => {
        return sum + (pkg.price_delta_cents || 0)
      }, 0)

      packageStripePriceIds = (packages || [])
        .map((pkg: any) => pkg.stripe_price_id)
        .filter(Boolean)
    }

    // Hole Basispreis aus prices Tabelle
    const { data: priceRow } = await supabase
      .from('prices')
      .select('id, stripe_price_id, unit_amount, currency')
      .eq('stripe_price_id', trip.stripe_price_id)
      .single()

    const baseUnitAmount = priceRow?.unit_amount ?? trip.base_price_cents ?? 0
    const currency = (priceRow?.currency || trip.currency || 'EUR').toLowerCase()

    if (!baseUnitAmount || baseUnitAmount <= 0) {
      return NextResponse.json({ error: 'Ungültiger Basispreis für die Reise.' }, { status: 400 })
    }

    const personsCount = Math.max(1, parseInt(String(persons), 10) || 1)

    const totalBaseAmount = baseUnitAmount * personsCount
    const totalPackageAmount = packageAmountPerPerson * personsCount
    const totalAmountCents = totalBaseAmount + totalPackageAmount

    if (totalAmountCents <= 0) {
      return NextResponse.json({ error: 'Ungültiger Gesamtbetrag.' }, { status: 400 })
    }

    const tripTitle = trip 
      ? (typeof trip.title === 'object' 
          ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || 'Golfreise')
          : trip.title || 'Golfreise')
      : 'Golfreise'

    const dateRange = tripDate
      ? `${new Date(tripDate.start_date).toLocaleDateString('de-DE')} - ${new Date(tripDate.end_date).toLocaleDateString('de-DE')}`
      : ''

    const description = [
      tripTitle,
      dateRange && `Termin: ${dateRange}`,
      `Teilnehmer: ${personsCount} Person${personsCount !== 1 ? 'en' : ''}`,
      packageNames.length > 0 && `Zusatzpakete: ${packageNames.join(', ')}`
    ].filter(Boolean).join(' · ')

    // Aktuell wird der Gesamtbetrag fällig
    const deposit_amount = totalAmountCents
    const rest_amount = 0

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: trip.stripe_price_id!,
        quantity: personsCount,
      },
    ]

    const addonLineItems = packageStripePriceIds.map((priceId) => ({
      price: priceId,
      quantity: personsCount,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [...lineItems, ...addonLineItems],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reisen`,
      metadata: {
        user_id: user?.id || 'guest',
        trip_id: trip_id || '',
        trip_date_id: trip_date_id || '',
        persons: String(personsCount),
        package_ids: JSON.stringify(package_ids || []),
        deposit_percent: '100',
        deposit_amount_cents: String(deposit_amount),
        rest_amount_cents: String(rest_amount),
        total_amount_cents: String(totalAmountCents),
        auto_charge_rest: 'false',
        product_id: trip.product_id || '',
        stripe_product_id: trip.stripe_product_id || '',
        stripe_price_id: trip.stripe_price_id || '',
        price_id: priceRow?.id || '',
        package_stripe_price_ids: JSON.stringify(packageStripePriceIds),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("❌ Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message || "Checkout fehlgeschlagen" },
      { status: 500 }
    )
  }
}
