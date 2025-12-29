import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  try {
    const data = await req.json()
    const supabase = await supabaseServer()
    const { addonId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates: any = {}

    if (typeof data.is_active === 'boolean') {
      updates.is_active = data.is_active
    }

    if (typeof data.title === 'string') {
      updates.title = data.title
    }

    if (typeof data.description === 'string') {
      updates.description = data.description
    }

    if (data.stripe_price_id) {
      const { data: priceRow, error: priceError } = await supabase
        .from('prices')
        .select('id, product_id, stripe_price_id, unit_amount, currency, nickname, products(id, slug, title, type, metadata)')
        .eq('stripe_price_id', data.stripe_price_id)
        .single()

      if (priceError || !priceRow) {
        return NextResponse.json({ error: 'Stripe Preis nicht gefunden' }, { status: 400 })
      }

      updates.product_id = priceRow.product_id
      updates.stripe_price_id = priceRow.stripe_price_id
      updates.price_delta_cents = priceRow.unit_amount
    }

    const { data: addon, error } = await supabase
      .from('addons')
      .update(updates)
      .eq('id', addonId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(addon)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
