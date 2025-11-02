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
        {trips?.map((trip: any) => (
          <div key={trip.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{trip.title}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trip.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trip.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                  </span>
                </div>
                
                <p className="text-gray-600 mt-2 line-clamp-2">{trip.description}</p>
                
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>📅 {trip.dates?.[0]?.count || 0} Termine</span>
                  <span>📍 {trip.destination}</span>
                  {trip.base_price_cents && (
                    <span>💰 ab {(trip.base_price_cents / 100).toFixed(0)}€</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/dashboard/reisen/${trip.id}/termine`}>
                  <Button variant="outline" size="sm">
                    📅 Termine
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
        ))}

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
