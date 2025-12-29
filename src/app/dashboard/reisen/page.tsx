import { supabaseServer } from "@/lib/supabaseServer"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardReisen() {
  const supabase = await supabaseServer()
  
  const { data: trips } = await supabase
    .from('vamosgolf_trips')
    .select(`
      *,
      dates:vamosgolf_trip_dates(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reisen verwalten</h1>
          <p className="text-gray-600">Erstelle und bearbeite Golfreisen</p>
        </div>
        <Link href="/dashboard/reisen/editor">
          <Button>+ Neue Reise</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {trips?.map((trip: any) => {
          const title = typeof trip.title === 'object'
            ? (trip.title?.de || trip.title?.en || Object.values(trip.title || {})?.[0] || '')
            : trip.title || 'Unbenannte Reise';

          const descriptionValue = typeof trip.description === 'object'
            ? (trip.description?.de || trip.description?.en || Object.values(trip.description || {})?.[0] || '')
            : trip.description || '';

          const availableDates = trip.dates?.[0]?.count || 0;
          const price = (trip.base_price_cents / 100).toFixed(2);

          return (
            <div key={trip.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/reisen/${trip.id}`} className="hover:underline">
                      <h2 className="text-xl font-bold">{title}</h2>
                    </Link>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trip.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {trip.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </div>
                  
                  {descriptionValue && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {String(descriptionValue).replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>📅 {availableDates} Termine</span>
                    <span>📍 {trip.destination}</span>
                    {trip.base_price_cents && (
                      <span>💰 ab {price}€</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/reisen/${trip.id}`}>
                    <Button variant="outline" size="sm">
                      📄 Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/reisen/${trip.id}/termine`}>
                    <Button variant="outline" size="sm">
                      📅 Termine
                    </Button>
                  </Link>
                  <Link href={`/dashboard/reisen/${trip.id}/addons`}>
                    <Button variant="outline" size="sm">
                      ➕ Add-ons
                    </Button>
                  </Link>
                  <Link href={`/dashboard/reisen/editor?id=${trip.id}`}>
                    <Button variant="outline" size="sm">
                      ✏️ Bearbeiten
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {!trips || trips.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">Noch keine Reisen erstellt</p>
            <Link href="/dashboard/reisen/editor">
              <Button>Erste Reise erstellen</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
