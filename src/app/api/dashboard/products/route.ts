import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const typeFilter = searchParams.get("type")
    const parentSlugFilter = searchParams.get("parent_slug")

    const supabase = await supabaseServer()

    let query = supabase
      .from("products")
      .select("id, title, slug, type, stripe_product_id, is_active, prices(id, stripe_price_id, unit_amount, currency, nickname)")
      .order("title", { ascending: true })

    if (typeFilter) {
      query = query.eq("type", typeFilter)
    }

    if (parentSlugFilter) {
      query = query.filter('metadata->>parent_product', 'eq', parentSlugFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading products", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      (data || []).map((product) => ({
        id: product.id,
        title: product.title,
        slug: product.slug,
        type: product.type,
        stripe_product_id: product.stripe_product_id,
        is_active: product.is_active,
        prices: (product.prices || []).map((price) => ({
          id: price.id,
          stripe_price_id: price.stripe_price_id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          nickname: price.nickname,
        })),
      }))
    )
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || "Fehler beim Laden der Produkte" }, { status: 500 })
  }
}
