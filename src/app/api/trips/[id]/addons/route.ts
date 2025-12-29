import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer()
    const { id } = await params

    const { data: addons, error } = await supabase
      .from('addons')
      .select('id, title, description, stripe_price_id, price_delta_cents, is_active, sort_order, created_at, product_id')
      .eq('trip_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const addonList = addons || []
    const priceIds = addonList.map((addon) => addon.stripe_price_id).filter(Boolean)
    const productIds = addonList.map((addon) => addon.product_id).filter(Boolean)

    const priceMap: Record<string, any> = {}
    if (priceIds.length > 0) {
      const { data: prices } = await supabase
        .from('prices')
        .select('id, product_id, stripe_price_id, unit_amount, currency, nickname')
        .in('stripe_price_id', priceIds)
      prices?.forEach((price) => {
        priceMap[price.stripe_price_id] = price
      })
    }

    const productMap: Record<string, any> = {}
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, title, slug, stripe_product_id')
        .in('id', productIds)
      products?.forEach((product) => {
        productMap[product.id] = product
      })
    }

    const response = addonList.map((addon) => ({
      ...addon,
      price: priceMap[addon.stripe_price_id || ''] || null,
      product: addon.product_id ? productMap[addon.product_id] || null : null,
    }))

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await req.json()
    const supabase = await supabaseServer()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('vamosgolf_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: trip } = await supabase
      .from('vamosgolf_trips')
      .select('slug')
      .eq('id', id)
      .single()

    const { data: priceRow, error: priceError } = await supabase
      .from('prices')
      .select('id, product_id, stripe_price_id, unit_amount, currency, nickname, products(id, slug, title, type, metadata)')
      .eq('stripe_price_id', data.stripe_price_id)
      .single()

    if (priceError || !priceRow) {
      return NextResponse.json({ error: 'Stripe Preis nicht gefunden' }, { status: 400 })
    }

    if (priceRow.products?.type !== 'addon') {
      return NextResponse.json({ error: 'Ausgewählter Preis ist kein Add-on' }, { status: 400 })
    }

    const parentSlug = priceRow.products?.metadata?.parent_product
    if (trip?.slug && parentSlug && trip.slug !== parentSlug) {
      return NextResponse.json({ error: 'Dieses Add-on gehört zu einer anderen Reise' }, { status: 400 })
    }

    const insertPayload = {
      trip_id: id,
      product_id: priceRow.product_id,
      title: data.title || priceRow.products?.title || priceRow.nickname || 'Add-on',
      description: data.description || '',
      stripe_price_id: priceRow.stripe_price_id,
      price_delta_cents: priceRow.unit_amount,
      is_active: true,
      sort_order: data.sort_order ?? 0,
    }

    const { data: addon, error } = await supabase
      .from('addons')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ...addon,
      price: {
        stripe_price_id: priceRow.stripe_price_id,
        unit_amount: priceRow.unit_amount,
        currency: priceRow.currency,
        nickname: priceRow.nickname,
      },
      product: priceRow.products
        ? {
            id: priceRow.products.id,
            slug: priceRow.products.slug,
            title: priceRow.products.title,
            stripe_product_id: priceRow.products.metadata?.stripe_product_id,
          }
        : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
