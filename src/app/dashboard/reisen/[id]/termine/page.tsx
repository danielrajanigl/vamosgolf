import { supabaseServer } from "@/lib/supabaseServer"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TripDatesPage({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer()
  
  const { data: trip } = await supabase
    .from('vamosgolf_trips')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!trip) notFound()

  const { data: dates } = await supabase
    .from('vamosgolf_trip_dates')
    .select('*')
    .eq('trip_id', params.id)
    .order('start_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{trip.title} - Termine</h1>
          <p className="text-gray-600">Verwalte Reisetermine und Teilnehmerzahlen</p>
        </div>
        <Link href={`/dashboard/reisen/${params.id}/termine/neu`}>
          <Button>+ Neuer Termin</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-4">Zeitraum</th>
              <th className="p-4">Teilnehmer (Min/Max)</th>
              <th className="p-4">Gebucht</th>
              <th className="p-4">Status</th>
              <th className="p-4">Preis</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {dates?.map((date) => (
              <tr key={date.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium">
                    {new Date(date.start_date).toLocaleDateString('de-DE')} - 
                    {new Date(date.end_date).toLocaleDateString('de-DE')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.ceil((new Date(date.end_date).getTime() - new Date(date.start_date).getTime()) / (1000 * 60 * 60 * 24))} Tage
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm">
                    {date.min_participants} - {date.max_participants}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{date.current_bookings || 0}</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min((date.current_bookings || 0) / date.max_participants * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    date.booking_status === 'sold_out' ? 'bg-red-100 text-red-800' :
                    date.booking_status === 'almost_full' ? 'bg-orange-100 text-orange-800' :
                    date.booking_status === 'guaranteed' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {date.booking_status === 'sold_out' ? 'Ausgebucht' :
                     date.booking_status === 'almost_full' ? 'Fast voll' :
                     date.booking_status === 'guaranteed' ? 'Garantiert' :
                     'Verfügbar'}
                  </span>
                </td>
                <td className="p-4">
                  {date.base_price_cents ? `${(date.base_price_cents / 100).toFixed(0)}€` : '-'}
                </td>
                <td className="p-4">
                  <Link href={`/dashboard/reisen/${params.id}/termine/${date.id}`}>
                    <Button variant="outline" size="sm">Bearbeiten</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!dates || dates.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Noch keine Termine angelegt. Erstelle den ersten Termin!
          </div>
        )}
      </div>

      <Link href="/dashboard/reisen">
        <Button variant="outline">← Zurück zur Übersicht</Button>
      </Link>
    </div>
  )
}
