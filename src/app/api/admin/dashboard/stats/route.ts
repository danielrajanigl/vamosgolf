import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

// GET: Dashboard-Statistiken für Admins/Editors
export async function GET(req: Request) {
  try {
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

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Montag
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Buchungen
    const { data: allBookings } = await supabase
      .from('vamosgolf_bookings')
      .select('id, deposit_amount_cents, rest_amount_cents, payment_status, created_at')

    const { data: todayBookings } = await supabase
      .from('vamosgolf_bookings')
      .select('id, deposit_amount_cents, rest_amount_cents, payment_status')
      .gte('created_at', todayStart.toISOString())

    const { data: weekBookings } = await supabase
      .from('vamosgolf_bookings')
      .select('id, deposit_amount_cents, rest_amount_cents, payment_status')
      .gte('created_at', weekStart.toISOString())

    const { data: monthBookings } = await supabase
      .from('vamosgolf_bookings')
      .select('id, deposit_amount_cents, rest_amount_cents, payment_status')
      .gte('created_at', monthStart.toISOString())

    // Termine
    const { data: allDates } = await supabase
      .from('vamosgolf_trip_dates')
      .select('id, start_date, end_date, current_bookings, max_participants, status')

    // Anstehende Termine (ab heute)
    const { data: upcomingDates } = await supabase
      .from('vamosgolf_trip_dates')
      .select('id, start_date, end_date, current_bookings, max_participants, status, trip_id')
      .gte('start_date', todayStart.toISOString().split('T')[0])
      .eq('status', 'confirmed')
      .order('start_date', { ascending: true })
      .limit(10)

    // Reisen
    const { data: trips } = await supabase
      .from('vamosgolf_trips')
      .select('id, status')

    // Berechnungen
    const calculateRevenue = (bookings: any[]) => {
      return bookings.reduce((sum, b) => {
        if (b.payment_status === 'paid') {
          return sum + (b.deposit_amount_cents + b.rest_amount_cents)
        } else if (b.payment_status === 'deposit_paid') {
          return sum + b.deposit_amount_cents
        }
        return sum
      }, 0)
    }

    const stats = {
      bookings: {
        total: allBookings?.length || 0,
        today: todayBookings?.length || 0,
        thisWeek: weekBookings?.length || 0,
        thisMonth: monthBookings?.length || 0,
        pending: allBookings?.filter(b => b.payment_status === 'none').length || 0,
        paid: allBookings?.filter(b => b.payment_status === 'paid').length || 0,
        depositPaid: allBookings?.filter(b => b.payment_status === 'deposit_paid').length || 0,
      },
      revenue: {
        total: calculateRevenue(allBookings || []) / 100,
        today: calculateRevenue(todayBookings || []) / 100,
        thisWeek: calculateRevenue(weekBookings || []) / 100,
        thisMonth: calculateRevenue(monthBookings || []) / 100,
      },
      trips: {
        total: trips?.length || 0,
        published: trips?.filter(t => t.status === 'published').length || 0,
        draft: trips?.filter(t => t.status === 'draft').length || 0,
      },
      dates: {
        total: allDates?.length || 0,
        upcoming: upcomingDates?.length || 0,
        confirmed: allDates?.filter(d => d.status === 'confirmed').length || 0,
        planned: allDates?.filter(d => d.status === 'planned').length || 0,
        cancelled: allDates?.filter(d => d.status === 'cancelled').length || 0,
      },
      capacity: {
        totalSpots: allDates?.reduce((sum, d) => sum + d.max_participants, 0) || 0,
        bookedSpots: allDates?.reduce((sum, d) => sum + d.current_bookings, 0) || 0,
        availableSpots: (allDates?.reduce((sum, d) => sum + d.max_participants, 0) || 0) - 
                       (allDates?.reduce((sum, d) => sum + d.current_bookings, 0) || 0),
        fullDates: allDates?.filter(d => d.current_bookings >= d.max_participants).length || 0,
        lowCapacityDates: allDates?.filter(d => {
          const available = d.max_participants - d.current_bookings
          return available > 0 && available <= 5 && d.status === 'confirmed'
        }).length || 0,
      },
      upcomingDates: upcomingDates?.map((date: any) => ({
        id: date.id,
        trip_id: date.trip_id,
        start_date: date.start_date,
        end_date: date.end_date,
        current_bookings: date.current_bookings,
        max_participants: date.max_participants,
        available_spots: date.max_participants - date.current_bookings,
        is_full: date.current_bookings >= date.max_participants,
        utilization_rate: date.max_participants > 0 
          ? Math.round((date.current_bookings / date.max_participants) * 100) 
          : 0,
      })) || [],
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}

