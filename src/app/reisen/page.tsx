import { supabaseServer } from '@/lib/supabaseServer';
export default async function ReisenPage() {
  const sb = supabaseServer();
  const { data: trips } = await sb.from('vamosgolf_trips').select('*').eq('status','published').order('created_at',{ ascending:false });
  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">VamosGolf – Reisen</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {trips?.map((t:any)=>(
          <a key={t.id} href={`/reisen/${t.slug}`} className="border rounded-lg overflow-hidden hover:shadow">
            {t.image_url ? <img src={t.image_url} alt="" className="w-full h-40 object-cover" /> : <div className="h-40 bg-gray-100"/>}
            <div className="p-4">
              <div className="font-semibold">{t.title?.de || t.title?.en || t.title?.es}</div>
              <div className="text-sm text-gray-600">{(t.base_price_cents/100).toFixed(2)} €</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
