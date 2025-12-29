import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

// GET: ICS Export für Termine
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const tripIds = searchParams.get('trip_ids')?.split(',') || []
    
    const supabase = await supabaseServer()
    
    // Prüfe ob User eingeloggt ist
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

    // Baue Query auf
    let query = supabase
      .from('vamosgolf_trip_dates')
      .select(`
        *,
        trip:vamosgolf_trips (
          id,
          slug,
          title,
          description,
          image_url
        )
      `)

    // Filter nach Datum
    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('end_date', endDate)
    }
    if (tripIds.length > 0) {
      query = query.in('trip_id', tripIds)
    }

    const { data: tripDates, error } = await query.order('start_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generiere ICS Content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VamosGolf//Termine//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:VamosGolf Termine
X-WR-CALDESC:Golfreisen Termine
X-WR-TIMEZONE:Europe/Berlin
`

    tripDates?.forEach((date: any) => {
      const trip = date.trip
      const title = typeof trip?.title === 'object' 
        ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || 'Golfreise')
        : trip?.title || 'Golfreise'
      
      const startDate = new Date(date.start_date)
      const endDate = new Date(date.end_date)
      
      // ICS Format: YYYYMMDDTHHMMSS
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      const uid = `vamosgolf-${date.id}@vamosgolf.de`
      const dtstart = formatDate(startDate)
      const dtend = formatDate(new Date(endDate.getTime() + 24 * 60 * 60 * 1000)) // +1 Tag für End-Datum
      
      const description = `Teilnehmer: ${date.current_bookings}/${date.max_participants}\nStatus: ${date.status}`

      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`
    })

    icsContent += `END:VCALENDAR`

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="vamosgolf-termine-${new Date().toISOString().split('T')[0]}.ics"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating ICS:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Generieren des ICS' },
      { status: 500 }
    )
  }
}

