import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { createClient } from "@supabase/supabase-js"

// GET: Alle Nutzer abrufen (nur für Admins)
export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer()
    
    // Prüfe ob User eingeloggt ist
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prüfe ob User Admin ist
    const { data: profileData, error: profileCheckError } = await supabase
      .from('vamosgolf_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const profile = profileData
    if (profileCheckError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Service Role Key für Admin-Operationen
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key nicht konfiguriert' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Hole alle Auth Users (ohne Cache, immer aktuelle Daten)
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      )
    }

    // Hole alle Profile (ohne Cache)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('vamosgolf_profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    // Kombiniere Auth Users mit Profilen
    const usersWithProfiles = users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)
      
      // Prüfe Email-Verifizierung korrekt: email_confirmed_at muss vorhanden sein
      const isEmailConfirmed = authUser.email_confirmed_at !== null && authUser.email_confirmed_at !== undefined
      
      return {
        id: authUser.id,
        email: authUser.email,
        email_confirmed: isEmailConfirmed, // Boolean für Kompatibilität
        email_confirmed_at: authUser.email_confirmed_at, // Timestamp - wichtig für Status-Prüfung
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        phone: authUser.phone,
        phone_confirmed: authUser.phone_confirmed_at !== null,
        role: profile?.role || 'client',
        full_name: profile?.full_name || null,
        profile_created_at: profile?.created_at || null,
      }
    })

    // Sortiere nach erstellt Datum (neueste zuerst)
    usersWithProfiles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({
      users: usersWithProfiles,
      total: usersWithProfiles.length
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Nutzer' },
      { status: 500 }
    )
  }
}

