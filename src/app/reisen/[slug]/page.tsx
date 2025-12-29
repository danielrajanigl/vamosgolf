import { supabaseServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import { 
  MapPin, 
  ArrowLeft, 
  Star,
  Clock,
  Shield,
  Sparkles,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TripBookingForm } from '@/components/TripBookingForm'
import { BookingInquiryCTA } from '@/components/CTAs/BookingInquiryCTA'

async function getTripData(slug: string) {
  const sb = await supabaseServer()
  const { data: trip } = await sb
    .from('vamosgolf_trips')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!trip) return null

  // Hole Termine und Add-ons
  const [datesResult, addonsResult] = await Promise.all([
    sb
      .from('vamosgolf_trip_dates')
      .select('*')
      .eq('trip_id', trip.id)
      .eq('status', 'confirmed')
      .order('start_date', { ascending: true }),
    sb
      .from('addons')
      .select('*')
      .eq('trip_id', trip.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
  ])

  return {
    trip,
    dates: datesResult.data || [],
    packages: addonsResult.data || []
  }
}

export default async function TripDetail({ params }: { params: Promise<{slug: string }> }) {
  const { slug } = await params
  const data = await getTripData(slug)

  if (!data || !data.trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Reise nicht gefunden</h1>
          <Link href="/reisen">
            <Button>Zurück zur Übersicht</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { trip, dates, packages } = data

  const title = typeof trip.title === 'object' 
    ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || '')
    : trip.title || 'Unbenannte Reise'

  const description = typeof trip.description === 'object'
    ? (trip.description?.de || trip.description?.en || Object.values(trip.description || {})?.[0] || '')
    : trip.description || ''

  const basePrice = trip.base_price_cents / 100

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link href="/reisen">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
        {trip.image_url ? (
          <img 
            src={trip.image_url} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1600&q=80';
            }}
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1600&q=80')`,
            }}
          ></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {title}
            </h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Premium Location</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{dates.length} verfügbare Termine</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>Premium Erlebnis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Reisebeschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </CardContent>
            </Card>

            {/* Highlights */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <Users className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Kleine Gruppen</h3>
                      <p className="text-sm text-gray-600">
                        Max. {trip.max_participants} Teilnehmer für persönliche Betreuung
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <Shield className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Sicher buchen</h3>
                      <p className="text-sm text-gray-600">
                        Sichere Zahlung über Stripe
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <Clock className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Flexible Termine</h3>
                      <p className="text-sm text-gray-600">
                        Wähle den passenden Termin für dich
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <Sparkles className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Premium Erfahrung</h3>
                      <p className="text-sm text-gray-600">
                        Unvergessliche Golf-Erlebnisse
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <TripBookingForm 
              trip={trip}
              dates={dates}
              packages={packages}
              basePrice={basePrice}
            />
            
            {/* Booking Inquiry CTA */}
            <BookingInquiryCTA
              tripId={trip.id}
              tripTitle={title}
              source="trip-detail"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
