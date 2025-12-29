import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

// GET: Anstehende Buchungen für Dashboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const upcoming = searchParams.get('upcoming') === 'true'
    
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

    let query = supabase
      .from('vamosgolf_bookings')
      .select(`
        id,
        persons,
        deposit_amount_cents,
        rest_amount_cents,
        payment_status,
        created_at,
        trip:vamosgolf_trips (
          id,
          title,
          slug,
          image_url
        ),
        trip_date:vamosgolf_trip_dates (
          id,
          start_date,
          end_date
        ),
        user:vamosgolf_profiles (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (upcoming) {
      const today = new Date().toISOString().split('T')[0]
      query = query
        .gte('trip_date.start_date', today)
        .eq('trip_date.status', 'confirmed')
    }

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Formatiere Buchungen
    const formattedBookings = bookings?.map((booking: any) => {
      const trip = booking.trip
      const tripDate = booking.trip_date
      const user = booking.user
      
      const title = typeof trip?.title === 'object' 
        ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || '')
        : trip?.title || 'Unbekannte Reise'

      return {
        id: booking.id,
        trip_title: title,
        trip_slug: trip?.slug,
        trip_image_url: trip?.image_url,
        start_date: tripDate?.start_date,
        end_date: tripDate?.end_date,
        persons: booking.persons,
        customer_name: user?.full_name || user?.email || 'Unbekannt',
        customer_email: user?.email,
        deposit_amount: booking.deposit_amount_cents / 100,
        rest_amount: booking.rest_amount_cents / 100,
        total_amount: (booking.deposit_amount_cents + booking.rest_amount_cents) / 100,
        payment_status: booking.payment_status,
        created_at: booking.created_at,
      }
    }) || []

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Buchungen' },
      { status: 500 }
    )
  }
}

