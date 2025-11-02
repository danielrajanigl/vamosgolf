import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const supabase = await supabaseServer()

    // Check if user is admin/editor
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

    // Create trip date
    const { data: tripDate, error } = await supabase
      .from('vamosgolf_trip_dates')
      .insert({
        trip_id: data.trip_id,
        start_date: data.start_date,
        end_date: data.end_date,
        min_participants: data.min_participants,
        max_participants: data.max_participants,
        current_bookings: 0,
        booking_status: 'available',
        base_price_cents: data.base_price_cents,
        status: data.status || 'confirmed',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trip date:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tripDate)
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
