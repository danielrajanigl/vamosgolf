import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function PUT(
  req: Request,
  { params }: { params: { id: string; addonId: string } }
) {
  try {
    const data = await req.json()
    const supabase = await supabaseServer()

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: addon, error } = await supabase
      .from('vamosgolf_trip_addons')
      .update(data)
      .eq('id', params.addonId)
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
