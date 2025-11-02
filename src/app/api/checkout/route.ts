import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    const { trip_id, trip_date_id, persons, package_ids, amount_cents } = await req.json()

    if (!amount_cents || amount_cents <= 0) {
      return NextResponse.json(
        { error: "Ungültiger Betrag" },
        { status: 400 }
      )
    }

    // Get user (or use guest data later)
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    // Calculate deposit (20%) and rest
    const deposit_amount = amount_cents
    const rest_amount = 0 // For now, full payment upfront

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "VamosGolf Golfreise",
              description: "Buchung einer Golfreise",
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/reisen`,
      metadata: {
        user_id: user?.id || 'guest',
        trip_id: trip_id || '',
        trip_date_id: trip_date_id || '',
        persons: String(persons || 1),
        package_ids: JSON.stringify(package_ids || []),
        deposit_percent: '100', // Full payment for now
        rest_amount_cents: String(rest_amount),
        auto_charge_rest: 'false',
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
