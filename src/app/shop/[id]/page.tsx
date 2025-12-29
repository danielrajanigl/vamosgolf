import { supabaseServer } from '@/lib/supabaseServer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Star, Shield, Sparkles, Users, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TripBookingForm } from "@/components/TripBookingForm";

async function getTripData(idOrSlug: string) {
  const sb = await supabaseServer();
  
  // Try to find by slug first, then by id
  let query = sb
    .from('vamosgolf_trips')
    .select('*')
    .eq('status', 'published');
  
  // Check if it's a UUID or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  
  if (isUUID) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }
  
  const { data: trip } = await query.single();

  if (!trip) return null;

  // Get dates and add-ons
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
  ]);

  return {
    trip,
    dates: datesResult.data || [],
    packages: addonsResult.data || []
  };
}

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTripData(id);

  if (!data || !data.trip) {
    notFound();
  }

  const { trip, dates, packages } = data;

  const title = typeof trip.title === 'object' 
    ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || '')
    : trip.title || 'Unbenannte Reise';

  const description = typeof trip.description === 'object'
    ? (trip.description?.de || trip.description?.en || Object.values(trip.description || {})?.[0] || '')
    : trip.description || '';

  const basePrice = trip.base_price_cents / 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link href="/shop">
          <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Shop
          </Button>
        </Link>
      </div>

      {/* Hero Image - Leicht und luftig */}
      <div className="relative h-[65vh] min-h-[600px] overflow-hidden">
        {trip.image_url ? (
          <img 
            src={trip.image_url} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1600&q=80')`,
            }}
          ></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 drop-shadow-lg">
              {title}
            </h1>
            <div className="flex flex-wrap gap-4 text-gray-700">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <MapPin className="h-5 w-5 text-sky-500" />
                <span className="font-medium">Premium Location</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Calendar className="h-5 w-5 text-sky-500" />
                <span className="font-medium">{dates.length} verfügbare Termine</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="font-medium">Premium Erlebnis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="border border-gray-100 shadow-sm bg-white">
              <CardHeader className="bg-gray-50/50">
                <CardTitle className="text-2xl text-gray-900">Reisebeschreibung</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-sky-600"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </CardContent>
            </Card>

            {/* Highlights */}
            <Card className="border border-gray-100 shadow-sm bg-white">
              <CardHeader className="bg-gray-50/50">
                <CardTitle className="text-2xl text-gray-900">Highlights</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <Users className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-gray-900">Kleine Gruppen</h3>
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
                      <h3 className="font-semibold mb-1 text-gray-900">Sicher buchen</h3>
                      <p className="text-sm text-gray-600">
                        Sichere Zahlung über Stripe
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <Calendar className="h-6 w-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-gray-900">Flexible Termine</h3>
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
                      <h3 className="font-semibold mb-1 text-gray-900">Premium Erfahrung</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
