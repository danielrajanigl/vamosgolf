import { supabaseServer } from '@/lib/supabaseServer';
export default async function TripDetail({ params }: { params: { slug: string }}) {
  const sb = supabaseServer();
  const { data: trip } = await sb.from('vamosgolf_trips').select('*').eq('slug', params.slug).single();
  if (!trip) return <div className="p-6">Nicht gefunden.</div>;
  const { data: dates } = await sb.from('vamosgolf_trip_dates').select('*').eq('trip_id', trip.id);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">{trip.title?.de || trip.title?.en || trip.title?.es}</h1>
      {trip.image_url && <img src={trip.image_url} className="w-full rounded" alt="" />}
      <div className="text-lg font-semibold">{(trip.base_price_cents/100).toFixed(2)} €</div>
      <h2 className="text-xl font-semibold mt-6">Termine</h2>
      <div className="space-y-3">
        {dates?.map((d:any)=>(
          <form key={d.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div>{new Date(d.start_date).toLocaleDateString()} – {new Date(d.end_date).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600">{d.current_bookings}/{d.max_participants} gebucht · Mindestanzahl {d.min_participants}</div>
            </div>
            <button onClick={async (e)=>{ e.preventDefault(); const r=await fetch('/api/checkout',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tripId: trip.id, tripDateId: d.id, persons: 1, packageIds: [], autoChargeRest: true })}); const {url}=await r.json(); if(url) window.location.href=url; }} className="bg-black text-white px-4 py-2 rounded">Jetzt buchen (Anzahlung)</button>
          </form>
        ))}
      </div>
    </main>
  );
}
