import { supabaseServer } from '@/lib/supabaseServer';
import { ProductCard } from "@/components/shop/ProductCard";
import { FilterBar } from "@/components/shop/FilterBar";
import { MapPin, Calendar, Star, Sparkles } from 'lucide-react';

async function getTrips() {
  const sb = await supabaseServer();
  const { data: trips } = await sb
    .from('vamosgolf_trips')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Get dates for availability
  const tripIds = trips?.map(t => t.id) || [];
  const { data: dates } = tripIds.length > 0 
    ? await sb
        .from('vamosgolf_trip_dates')
        .select('trip_id, status')
        .in('trip_id', tripIds)
        .eq('status', 'confirmed')
    : { data: null };

  // Count available dates per trip
  const datesByTrip = new Map<string, number>();
  dates?.forEach((d: any) => {
    datesByTrip.set(d.trip_id, (datesByTrip.get(d.trip_id) || 0) + 1);
  });

  return { trips: trips || [], datesByTrip };
}

export default async function ShopPage() {
  const { trips, datesByTrip } = await getTrips();

  const products = trips.map((trip: any) => {
    const title = typeof trip.title === 'object' 
      ? (trip.title.de || trip.title.en || Object.values(trip.title)[0] || '')
      : trip.title || 'Unbenannte Reise';
    
    const description = typeof trip.description === 'object'
      ? (trip.description.de || trip.description.en || Object.values(trip.description)[0] || '')
      : trip.description || '';

    return {
      id: trip.id,
      slug: trip.slug,
      name: title,
      description: description.replace(/<[^>]*>/g, '').substring(0, 150),
      price: (trip.base_price_cents / 100).toFixed(0),
      priceCents: trip.base_price_cents,
      image: trip.image_url || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80', // Golfplatz mit grünen Greens
      category: "Reise",
      availableDates: datesByTrip.get(trip.id) || 0,
    };
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Leicht und luftig mit Andalusien-Bild */}
      <section className="relative h-[70vh] min-h-[600px] overflow-hidden">
        {/* Background Image - Spanischer Golfplatz mit grünen Greens */}
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
              Golfreisen nach Andalusien
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto drop-shadow-md">
              Erlebe unvergessliche Golf-Tage an Spaniens schönsten Plätzen zwischen Meer und Grün
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
      </section>

      {/* Shop Content - Luftiges Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Verfügbare Golfreisen
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Wähle deine perfekte Golfreise aus und buche jetzt deinen Platz
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 mx-auto text-sky-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">Noch keine Reisen verfügbar</h3>
            <p className="text-gray-500">Bald kommen neue aufregende Golfreisen hinzu!</p>
          </div>
        )}
      </main>
    </div>
  );
}
