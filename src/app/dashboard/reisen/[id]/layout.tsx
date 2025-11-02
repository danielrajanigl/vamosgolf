import { supabaseServer } from "@/lib/supabaseServer"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const supabase = await supabaseServer()
  
  const { data: trip } = await supabase
    .from('vamosgolf_trips')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!trip) notFound()

  const tabs = [
    { name: 'Allgemein', href: `/dashboard/reisen/${params.id}` },
    { name: 'Termine', href: `/dashboard/reisen/${params.id}/termine` },
    { name: 'Add-ons', href: `/dashboard/reisen/${params.id}/addons` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              trip.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {trip.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
            </span>
          </div>
          <p className="text-gray-600 mt-1">{trip.destination}</p>
        </div>
        
        <Link href="/dashboard/reisen">
          <Button variant="outline">← Zurück</Button>
        </Link>
      </div>

      <div className="border-b">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="pb-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  )
}
