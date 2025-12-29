import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prüfe ob User Admin oder Editor ist
    const { data: profile } = await supabase
      .from('vamosgolf_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('vamosgolf_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('lead_type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: leads, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(leads)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

