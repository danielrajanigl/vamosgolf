"use client"

import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabaseClient"

interface DashboardHeaderProps {
  user: User
  profile: { full_name?: string; email?: string } | null
  role: string
}

export function DashboardHeader({ user, profile, role }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = supabaseBrowser()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
    window.location.href = "/dashboard"
  }

  const displayName = profile?.full_name || profile?.email || user.email || "User"

  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="ml-4"
          >
            Abmelden
          </Button>
        </div>
      </div>
    </header>
  )
}
