import { supabaseServer } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServer()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login?redirect=/dashboard")
  }

  // Check if user is admin or editor
  const { data: profile } = await supabase
    .from("vamosgolf_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    redirect("/")
  }

  const links = [
    { name: "Übersicht", href: "/dashboard" },
    { name: "Reisen", href: "/dashboard/reisen" },
    { name: "Termine", href: "/dashboard/termine" },
    { name: "Preise", href: "/dashboard/preise" },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div className="text-2xl font-bold mb-8 text-emerald-600">VamosGolf</div>
        <nav className="flex flex-col gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded p-2 hover:bg-gray-100 text-gray-700"
            >
              {l.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
