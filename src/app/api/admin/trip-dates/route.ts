import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

// GET: Alle Termine mit Trip-Informationen abrufen (nur für Admins/Editors)
export async function GET(req: Request) {
  try {
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
      return NextResponse.json({ error: 'Forbidden - Admin/Editor only' }, { status: 403 })
    }

    // Hole alle Termine mit Trip-Daten
    const { data: tripDates, error: datesError } = await supabase
      .from('vamosgolf_trip_dates')
      .select(`
        *,
        trip:vamosgolf_trips (
          id,
          slug,
          title,
          description,
          image_url,
          base_price_cents,
          currency,
          status
        )
      `)
      .order('start_date', { ascending: true })

    if (datesError) {
      console.error('Error fetching trip dates:', datesError)
      return NextResponse.json(
        { error: datesError.message },
        { status: 500 }
      )
    }

    // Formatiere die Daten für die Frontend
    const formattedDates = tripDates?.map((date: any) => {
      const trip = date.trip
      const title = typeof trip?.title === 'object' 
        ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || '')
        : trip?.title || ''
      
      // Extrahiere Destination aus title (z.B. "Portugal Algarve Golf" -> "Portugal Algarve")
      // Oder aus description falls vorhanden
      let destination = ''
      
      // Versuche aus title zu extrahieren (typischerweise: "Land Region" oder nur "Land")
      if (title) {
        const titleParts = title.split(' ')
        // Nimm die ersten 1-2 Wörter als Destination (meist Land/Region)
        if (titleParts.length >= 2) {
          destination = titleParts.slice(0, 2).join(' ')
        } else if (titleParts.length === 1) {
          destination = titleParts[0]
        }
      }
      
      // Alternative: Suche in description nach bekannten Ländern/Regionen
      if (trip?.description) {
        const desc = typeof trip.description === 'object' 
          ? (trip.description.de || trip.description.en || Object.values(trip.description)[0] || '')
          : trip.description || ''
        
        // Bekannte Golf-Destinationen
        const knownDestinations = [
          'Algarve', 'Portugal', 'Spanien', 'Andalusia', 'Costa del Sol',
          'Mallorca', 'Teneriffa', 'Gran Canaria', 'Marokko', 'Türkei',
          'Griechenland', 'Italien', 'Sizilien', 'Sardinien', 'Kroatien'
        ]
        
        for (const dest of knownDestinations) {
          if (desc.toLowerCase().includes(dest.toLowerCase())) {
            destination = dest
            break
          }
        }
      }
      
      return {
        id: date.id,
        trip_id: date.trip_id,
        start_date: date.start_date,
        end_date: date.end_date,
        min_participants: date.min_participants,
        max_participants: date.max_participants,
        current_bookings: date.current_bookings,
        status: date.status,
        supplier_policy: date.supplier_policy,
        // Trip-Informationen
        trip_title: title,
        trip_slug: trip?.slug,
        trip_image_url: trip?.image_url,
        trip_base_price_cents: trip?.base_price_cents,
        trip_currency: trip?.currency || 'EUR',
        trip_status: trip?.status,
        trip_destination: destination || title, // Fallback auf title wenn keine Destination gefunden
        // Berechnete Felder
        available_spots: date.max_participants - date.current_bookings,
        is_full: date.current_bookings >= date.max_participants,
        duration_days: Math.ceil(
          (new Date(date.end_date).getTime() - new Date(date.start_date).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1,
      }
    }) || []

    return NextResponse.json({
      dates: formattedDates,
      total: formattedDates.length
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Termine' },
      { status: 500 }
    )
  }
}

