import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { createClient } from "@supabase/supabase-js"

// PUT: Nutzer aktualisieren (Email verifizieren, Rolle ändern, etc.)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer()
    const { id } = await params
    
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

    const body = await req.json()
    console.log('Received update request for user:', id, 'with body:', body)
    
    const { 
      email_confirm, 
      role, 
      full_name,
      email,
      phone,
      ban_user,
      unban_user
    } = body

    // Update Auth User
    const updateData: any = {}
    
    // Email-Verifizierung zuerst behandeln (separate Operation für bessere Kontrolle)
    if (email_confirm === true) {
      // Email manuell verifizieren - setze email_confirmed_at auf aktuellen Timestamp
      // Wichtig: email_confirmed_at muss gesetzt sein, damit der User einloggen kann
      const confirmedAt = new Date().toISOString()
      console.log('Verifying email for user:', id, 'Setting email_confirmed_at to:', confirmedAt)
      
      try {
        const { data: verifyResult, error: verifyError } = await supabaseAdmin.auth.admin.updateUserById(
          id,
          {
            email_confirmed_at: confirmedAt,
            ban_duration: '0' // Stelle sicher, dass der User nicht gebannt ist
          }
        )

        if (verifyError) {
          console.error('Error verifying email:', verifyError)
          console.error('Error details:', JSON.stringify(verifyError, null, 2))
          return NextResponse.json(
            { 
              error: verifyError.message || 'Fehler beim Verifizieren der Email',
              details: verifyError
            },
            { status: 500 }
          )
        }
        
        console.log('Email verified successfully. Result:', verifyResult?.user?.email_confirmed_at)
        
        // Verifiziere dass es wirklich gesetzt wurde
        if (!verifyResult?.user?.email_confirmed_at) {
          console.warn('Warning: email_confirmed_at wurde möglicherweise nicht gesetzt')
        }
      } catch (err: any) {
        console.error('Exception during email verification:', err)
        return NextResponse.json(
          { 
            error: err.message || 'Unerwarteter Fehler beim Verifizieren der Email',
            details: err.toString()
          },
          { status: 500 }
        )
      }
    }
    
    // Update Auth User für andere Felder
    if (email) {
      updateData.email = email
    }
    
    if (phone !== undefined) {
      updateData.phone = phone || null
    }

    // Ban/Unban behandeln (separate Operationen)
    if (ban_user === true) {
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        { ban_duration: '876000h' } // ~100 Jahre
      )
      if (banError) {
        console.error('Error banning user:', banError)
        return NextResponse.json(
          { error: banError.message },
          { status: 500 }
        )
      }
    }

    if (unban_user === true && email_confirm !== true) {
      // Nur wenn email_confirm nicht gesetzt ist, sonst wurde es bereits oben behandelt
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        { ban_duration: '0' }
      )
      if (unbanError) {
        console.error('Error unbanning user:', unbanError)
        return NextResponse.json(
          { error: unbanError.message },
          { status: 500 }
        )
      }
    }

    // Update Auth User falls updateData nicht leer (für email/phone)
    if (Object.keys(updateData).length > 0) {
      console.log('Updating auth user with data:', updateData)
      const { data: updatedAuthUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        updateData
      )

      if (updateError) {
        console.error('Error updating auth user:', updateError)
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }
      
      console.log('Auth user updated successfully.')
    }

    // Update Profil
    const profileUpdate: any = {}
    
    // Rolle aktualisieren wenn angegeben
    if (role && ['client', 'editor', 'admin'].includes(role)) {
      profileUpdate.role = role
    }
    
    // Full Name aktualisieren (auch wenn leer/null, um es zu löschen)
    if (full_name !== undefined) {
      profileUpdate.full_name = full_name || null
      console.log('Updating full_name to:', full_name || null)
    }

    console.log('Profile update data:', profileUpdate)

    // Profil-Update ausführen wenn es Änderungen gibt
    if (Object.keys(profileUpdate).length > 0) {
      const { data: updateResult, error: profileError } = await supabaseAdmin
        .from('vamosgolf_profiles')
        .update(profileUpdate)
        .eq('id', id)
        .select()

      if (profileError) {
        console.error('Error updating profile:', profileError)
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        )
      }
      
      console.log('Profile update result:', updateResult)
    } else {
      console.log('No profile updates to apply')
    }

    // Hole aktualisierten User (wichtig: nach Update neu laden um aktuelle Daten zu bekommen)
    const { data: { user: updatedUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(id)
    
    if (getUserError) {
      console.error('Error fetching updated user:', getUserError)
      return NextResponse.json(
        { error: getUserError.message },
        { status: 500 }
      )
    }

    // Hole aktualisiertes Profil (ohne .single() um Fehler zu vermeiden)
    const { data: profiles, error: profileFetchError } = await supabaseAdmin
      .from('vamosgolf_profiles')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (profileFetchError) {
      console.error('Error fetching profile:', profileFetchError)
      return NextResponse.json(
        { error: profileFetchError.message },
        { status: 500 }
      )
    }

    const updatedProfile = profiles && profiles.length > 0 ? profiles[0] : null

    // Prüfe Email-Verifizierung korrekt
    const isEmailConfirmed = updatedUser?.email_confirmed_at !== null && updatedUser?.email_confirmed_at !== undefined
    console.log('Final email_confirmed status:', {
      email_confirmed_at: updatedUser?.email_confirmed_at,
      is_confirmed: isEmailConfirmed,
      user_id: updatedUser?.id
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        email_confirmed: isEmailConfirmed,
        email_confirmed_at: updatedUser?.email_confirmed_at,
        role: updatedProfile?.role || 'client',
        full_name: updatedProfile?.full_name || null,
        banned_until: updatedUser?.banned_until,
        phone: updatedUser?.phone,
      }
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Aktualisieren des Nutzers' },
      { status: 500 }
    )
  }
}

// DELETE: Nutzer löschen
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer()
    const { id } = await params
    
    // Prüfe ob User eingeloggt ist
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prüfe ob User Admin ist
    const { data: profile } = await supabase
      .from('vamosgolf_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Verhindere, dass sich Admin selbst löscht
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Du kannst dich nicht selbst löschen' },
        { status: 400 }
      )
    }

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

    // Lösche User (Cascade löscht auch Profil)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Löschen des Nutzers' },
      { status: 500 }
    )
  }
}

