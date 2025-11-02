"use client"

import { useState, useEffect } from "react"
import { supabaseBrowser } from "@/lib/supabaseClient"
import { User } from "@supabase/supabase-js"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = supabaseBrowser()

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Anmelden</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Registrieren</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        Hallo, {user.email}
      </span>
      <Button variant="outline" onClick={handleSignOut}>
        Abmelden
      </Button>
    </div>
  )
}
