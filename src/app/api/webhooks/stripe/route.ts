import { stripe } from '@/lib/stripe'
import {
  deactivateStripePrice,
  deactivateStripeProduct,
  syncStripeProductToSupabase,
} from '@/lib/stripeSync'
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
    case 'product.created':
    case 'product.updated':
    case 'product.metadata_updated': {
      const product = event.data.object as Stripe.Product
      await syncStripeProductToSupabase(product.id)
      break
    }

    case 'product.deleted': {
      const product = event.data.object as Stripe.DeletedProduct
      await deactivateStripeProduct(product.id)
      break
    }

    case 'price.created':
    case 'price.updated': {
      const price = event.data.object as Stripe.Price
      const productId = typeof price.product === 'string' ? price.product : price.product.id
      await syncStripeProductToSupabase(productId)
      break
    }

    case 'price.deleted': {
      const price = event.data.object as Stripe.Price
      await deactivateStripePrice(price.id)
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('💰 Payment successful for session:', session.id)

      // Use service role client for webhook
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const metadata = session.metadata || {}
      const persons = Math.max(1, parseInt(metadata.persons || '1', 10) || 1)
      const packageIds: string[] = metadata.package_ids ? JSON.parse(metadata.package_ids) : []
      const depositPercent = parseInt(metadata.deposit_percent || '20', 10)
      const depositAmountCents = session.amount_total || parseInt(metadata.deposit_amount_cents || '0', 10)
      const restAmountCents = parseInt(metadata.rest_amount_cents || '0', 10)
      const totalAmountCents = parseInt(metadata.total_amount_cents || String(depositAmountCents), 10)
      const currency = session.currency?.toUpperCase() || 'EUR'

      // Idempotency: prüfen, ob Order bereits existiert
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle()

      let orderId = existingOrder?.id

      // Stripe Line Items laden
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
      })

      const lineItemDetails = lineItems.data.map((item) => ({
        priceId: item.price?.id || '',
        quantity: item.quantity || 1,
        description: item.description || item.price?.nickname || 'Stripe Position',
        amountSubtotal: item.amount_subtotal || ((item.price?.unit_amount || 0) * (item.quantity || 1)),
      }))

      const priceIds = lineItemDetails.map((item) => item.priceId).filter(Boolean)

      const { data: priceRows = [] } = priceIds.length
        ? await supabase
            .from('prices')
            .select('id, product_id, stripe_price_id, products(type, parent_product_id)')
            .in('stripe_price_id', priceIds)
        : { data: [] as any[] }

      const priceMap = priceRows.reduce<Record<string, any>>((acc, row) => {
        acc[row.stripe_price_id] = row
        return acc
      }, {})

      const addonProductIds = priceRows
        .filter((row) => row.products?.type === 'addon')
        .map((row) => row.product_id)

      const { data: addonRows = [] } = addonProductIds.length
        ? await supabase
            .from('addons')
            .select('id, product_id')
            .in('product_id', addonProductIds)
        : { data: [] as any[] }

      const addonMap = addonRows.reduce<Record<string, string>>((acc, row) => {
        acc[row.product_id] = row.id
        return acc
      }, {})

      if (!orderId) {
        // Trip Details für Titel und Produkt-ID holen
        let tripTitle = 'VamosGolf Reise'
        let tripProductId: string | null = metadata.product_id || null

        if (metadata.trip_id) {
          const { data: trip } = await supabase
            .from('vamosgolf_trips')
            .select('title, product_id')
            .eq('id', metadata.trip_id)
            .single()

          if (trip) {
            tripTitle = typeof trip.title === 'object'
              ? trip.title.de || trip.title.en || Object.values(trip.title)[0] || tripTitle
              : trip.title || tripTitle

            if (!tripProductId && trip.product_id) {
              tripProductId = trip.product_id
            }
          }
        }

        const orderInsert = {
          user_id: metadata.user_id && metadata.user_id !== 'guest' ? metadata.user_id : null,
          total_amount: totalAmountCents,
          currency,
          status: 'paid',
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          stripe_checkout_session_id: session.id,
          metadata: {
            deposit_amount_cents: depositAmountCents,
            rest_amount_cents: restAmountCents,
            deposit_percent: depositPercent,
            persons,
            package_ids: packageIds,
            stripe_price_id: metadata.stripe_price_id,
            stripe_product_id: metadata.stripe_product_id,
            auto_charge_rest: metadata.auto_charge_rest === 'true',
          },
        }

        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderInsert)
          .select()
          .single()

        if (orderError) {
          console.error('❌ Error creating order:', orderError)
        } else {
          orderId = newOrder.id

          for (const item of lineItemDetails) {
            const priceRow = priceMap[item.priceId]
            const productType = priceRow?.products?.type || 'reise'

            const orderItem = {
              order_id: newOrder.id,
              product_id: priceRow?.product_id || null,
              price_id: priceRow?.id || null,
              quantity: item.quantity,
              unit_amount: item.amountSubtotal && item.quantity > 0
                ? Math.round(item.amountSubtotal / item.quantity)
                : item.amountSubtotal,
              name_snapshot: item.description,
              meta: {
                stripe_price_id: item.priceId,
                product_type: productType,
                deposit_amount_cents: depositAmountCents,
                rest_amount_cents: restAmountCents,
              },
            }

            const { error: orderItemError } = await supabase
              .from('order_items')
              .insert(orderItem)

            if (orderItemError) {
              console.error('⚠️ Error creating order item:', orderItemError)
            }

            const purchase = {
              user_id: newOrder.user_id,
              product_id: priceRow?.product_id || null,
              addon_id: addonMap[priceRow?.product_id || ''] || null,
              order_id: newOrder.id,
              stripe_session_id: session.id,
              stripe_price_id: item.priceId,
              quantity: item.quantity,
              amount_cents: item.amountSubtotal,
              currency,
              metadata: {
                product_type: productType,
                package_ids: packageIds,
              },
            }

            const { error: purchaseError } = await supabase
              .from('purchases')
              .insert(purchase)

            if (purchaseError) {
              console.error('⚠️ Error creating purchase:', purchaseError)
            }
          }

          const travelBooking = {
            order_id: newOrder.id,
            trip_id: metadata.trip_id || null,
            trip_date_id: metadata.trip_date_id || null,
            package_ids: packageIds,
            persons,
            metadata: {
              deposit_amount_cents: depositAmountCents,
              rest_amount_cents: restAmountCents,
              auto_charge_rest: metadata.auto_charge_rest === 'true',
            },
          }

          const { error: travelBookingError } = await supabase
            .from('travel_bookings')
            .insert(travelBooking)

          if (travelBookingError) {
            console.error('⚠️ Error creating travel booking:', travelBookingError)
          }
        }
      }

      const bookingData: any = {
        persons,
        package_ids: packageIds,
        deposit_percent: depositPercent,
        deposit_amount_cents: depositAmountCents,
        rest_amount_cents: restAmountCents,
        auto_charge_rest: metadata.auto_charge_rest === 'true',
        stripe_customer_id: session.customer as string,
        stripe_checkout_session_id: session.id,
        payment_status: 'deposit_paid',
      }

      // Add optional fields only if they exist and are valid UUIDs
      if (metadata.user_id && metadata.user_id !== 'guest') {
        bookingData.user_id = metadata.user_id
      }
      if (metadata.trip_id) {
        bookingData.trip_id = metadata.trip_id
      }
      if (metadata.trip_date_id) {
        bookingData.trip_date_id = metadata.trip_date_id
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

      // Update trip date booking count
      if (metadata.trip_date_id && booking.persons) {
        try {
          await supabase.rpc('vamosgolf_increment_date_bookings', {
            p_trip_date_id: metadata.trip_date_id,
            p_inc: booking.persons
          })
          console.log('✅ Updated trip date booking count')
        } catch (rpcError) {
          console.error('⚠️ Error updating booking count:', rpcError)
          // Don't fail the webhook if this fails
        }
      }

      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
