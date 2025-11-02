import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer()

    const { data: addons, error } = await supabase
      .from('vamosgolf_trip_addons')
      .select('*')
      .eq('trip_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(addons)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json()
    const supabase = await supabaseServer()

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

    const { data: addon, error } = await supabase
      .from('vamosgolf_trip_addons')
      .insert({
        trip_id: params.id,
        name: data.name,
        description: data.description,
        price_cents: data.price_cents,
        max_quantity: data.max_quantity,
        active: true,
      })
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
