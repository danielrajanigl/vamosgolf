import { supabaseServer } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Search, MapPin, Calendar, Star, ArrowRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default async function ReisenPage() {
  const sb = await supabaseServer();
  const { data: trips } = await sb
    .from('vamosgolf_trips')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Hole auch die Termine um Verfügbarkeit zu zeigen
  const tripIds = trips?.map(t => t.id) || [];
  const { data: dates } = tripIds.length > 0 
    ? await sb
        .from('vamosgolf_trip_dates')
        .select('trip_id, status')
        .in('trip_id', tripIds)
        .eq('status', 'confirmed')
    : { data: null };

  // Zähle verfügbare Termine pro Trip
  const datesByTrip = new Map<string, number>();
  dates?.forEach((d: any) => {
    datesByTrip.set(d.trip_id, (datesByTrip.get(d.trip_id) || 0) + 1);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Leicht und luftig */}
      <section className="relative h-[70vh] min-h-[600px] overflow-hidden">
        {/* Background Image - Spanischer Golfplatz */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/90"></div>
        
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-gray-900 drop-shadow-lg">
              Premium Golfreisen
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto drop-shadow-md">
              Entdecke unvergessliche Golf-Erlebnisse an den schönsten Plätzen der Welt
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="text-gray-800 font-medium">Premium Locations</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm">
                <MapPin className="h-5 w-5 text-sky-500" />
                <span className="text-gray-800 font-medium">Südspanien</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm">
                <Calendar className="h-5 w-5 text-sky-500" />
                <span className="text-gray-800 font-medium">Flexible Termine</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)"/>
          </svg>
        </div>
      </section>

      {/* Shop Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search & Filter Bar */}
        <div className="mb-12">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Nach Reise suchen..."
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Button variant="outline" className="h-12 px-6">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips Grid */}
        {trips && trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip: any) => {
              const title = typeof trip.title === 'object' 
                ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || '')
                : trip.title || 'Unbenannte Reise';
              
              const description = typeof trip.description === 'object'
                ? (trip.description.de || trip.description.en || Object.values(trip.description)[0] || '')
                : trip.description || '';
              
              const availableDates = datesByTrip.get(trip.id) || 0;
              const price = (trip.base_price_cents / 100).toFixed(2);
              
              return (
                <Link 
                  key={trip.id} 
                  href={`/reisen/${trip.slug}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50">
                      {trip.image_url ? (
                        <img 
                          src={trip.image_url} 
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80';
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80')`,
                          }}
                        ></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      
                      {/* Badge */}
                      {availableDates > 0 && (
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-sky-700 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                          {availableDates} Termin{availableDates !== 1 ? 'e' : ''}
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-sky-600 transition-colors">
                        {title}
                      </h3>
                      
                      {description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                        <div>
                          <div className="text-3xl font-bold text-sky-600">
                            {price} <span className="text-lg font-normal text-gray-600">€</span>
                          </div>
                          <div className="text-sm text-gray-500">ab pro Person</div>
                        </div>
                        <Button className="bg-sky-500 hover:bg-sky-600 text-white group-hover:translate-x-1 transition-transform shadow-sm">
                          Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">Noch keine Reisen verfügbar</h3>
            <p className="text-gray-500">Bald kommen neue aufregende Golfreisen hinzu!</p>
          </div>
        )}
      </section>
    </div>
  );
}
