import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('⚠️ Webhook signature failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log('✅ Webhook received:', event.type)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('💰 Payment successful for session:', session.id)

      // Use service role client for webhook
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const bookingData: any = {
        persons: parseInt(session.metadata?.persons || '1'),
        package_ids: session.metadata?.package_ids ? JSON.parse(session.metadata.package_ids) : [],
        deposit_percent: parseInt(session.metadata?.deposit_percent || '100'),
        deposit_amount_cents: session.amount_total || 0,
        rest_amount_cents: parseInt(session.metadata?.rest_amount_cents || '0'),
        auto_charge_rest: session.metadata?.auto_charge_rest === 'true',
        stripe_customer_id: session.customer as string,
        stripe_checkout_session_id: session.id,
        payment_status: 'deposit_paid',
      }

      // Add optional fields only if they exist and are valid UUIDs
      if (session.metadata?.user_id && session.metadata.user_id !== 'guest') {
        bookingData.user_id = session.metadata.user_id
      }
      if (session.metadata?.trip_id) {
        bookingData.trip_id = session.metadata.trip_id
      }
      if (session.metadata?.trip_date_id) {
        bookingData.trip_date_id = session.metadata.trip_date_id
      }

      const { data: booking, error } = await supabase
        .from('vamosgolf_bookings')
        .insert(bookingData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating booking:', error)
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
      }

      console.log('✅ Booking created:', booking.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
