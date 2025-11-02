"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = supabaseBrowser()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from("vamosgolf_profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName || null,
            role: "client",
          })

        if (profileError) {
          console.error("Profile creation error:", profileError)
        }
      }

      setMessage(
        "Registrierung erfolgreich! Bitte überprüfe deine Email für den Bestätigungslink."
      )
      
      setEmail("")
      setPassword("")
      setFullName("")
    } catch (error: any) {
      setError(error.message || "Registrierung fehlgeschlagen")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message || "Google Registrierung fehlgeschlagen")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
          <CardDescription>
            Registriere dich für exklusive Golf-Erlebnisse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
              {message}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            Mit Google registrieren
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Oder mit Email</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Max Mustermann"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="deine@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrierung läuft..." : "Konto erstellen"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Bereits registriert?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Jetzt anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
