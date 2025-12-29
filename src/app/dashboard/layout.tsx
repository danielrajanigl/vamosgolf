import { supabaseServer } from "@/lib/supabaseServer"
import Link from "next/link"
import { DashboardHeader } from "./DashboardHeader"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await supabaseServer()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Wenn nicht eingeloggt, Layout nicht rendern - die page.tsx zeigt Login/Register
    return <>{children}</>
  }

  // Get user role and profile for navigation
  const { data: profile } = await supabase
    .from("vamosgolf_profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single()

  const role = profile?.role || "client"

  // Navigation links based on role
  const baseLinks = [
    { name: "Übersicht", href: "/dashboard" },
  ]

  const adminEditorLinks = [
    { name: "Reisen", href: "/dashboard/reisen" },
    { name: "Leads", href: "/dashboard/leads" },
    { name: "Termine", href: "/dashboard/termine" },
    { name: "Preise", href: "/dashboard/preise" },
  ]

  const adminOnlyLinks = role === "admin" 
    ? [{ name: "Benutzer", href: "/dashboard/admin/users" }]
    : []

  const links = role === "admin"
    ? [...baseLinks, ...adminEditorLinks, ...adminOnlyLinks]
    : role === "editor"
    ? [...baseLinks, ...adminEditorLinks]
    : baseLinks

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
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          user={user} 
          profile={profile} 
          role={role}
        />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
