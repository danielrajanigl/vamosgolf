import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

// GET: Eigene Buchungen für Clients
export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bookings, error } = await supabase
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
          end_date,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedBookings = bookings?.map((booking: any) => {
      const trip = booking.trip
      const tripDate = booking.trip_date
      
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
        trip_status: tripDate?.status,
        persons: booking.persons,
        deposit_amount: booking.deposit_amount_cents / 100,
        rest_amount: booking.rest_amount_cents / 100,
        total_amount: (booking.deposit_amount_cents + booking.rest_amount_cents) / 100,
        payment_status: booking.payment_status,
        created_at: booking.created_at,
        is_upcoming: tripDate?.start_date 
          ? new Date(tripDate.start_date) >= new Date()
          : false,
      }
    }) || []

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error: any) {
    console.error('Error fetching user bookings:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Buchungen' },
      { status: 500 }
    )
  }
}

