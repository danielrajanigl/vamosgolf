import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    const { email, full_name, source } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail ist erforderlich' },
        { status: 400 }
      )
    }

    const supabase = await supabaseServer()

    // Prüfe ob bereits abonniert
    const { data: existing } = await supabase
      .from('vamosgolf_newsletter_subscriptions')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: 'Diese E-Mail ist bereits angemeldet' },
          { status: 400 }
        )
      } else {
        // Re-aktivieren
        await supabase
          .from('vamosgolf_newsletter_subscriptions')
          .update({ 
            is_active: true,
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
            source,
          })
          .eq('id', existing.id)

        // Erstelle Lead
        await supabase
          .from('vamosgolf_leads')
          .insert({
            email: email.toLowerCase(),
            full_name,
            lead_type: 'newsletter',
            source: source || 'unknown',
            status: 'new',
          })

        return NextResponse.json({ success: true, message: 'Newsletter-Abonnement reaktiviert' })
      }
    }

    // Neues Abonnement erstellen
    const { data: subscription, error: subError } = await supabase
      .from('vamosgolf_newsletter_subscriptions')
      .insert({
        email: email.toLowerCase(),
        full_name,
        is_active: true,
        source: source || 'unknown',
      })
      .select()
      .single()

    if (subError) {
      console.error('Error creating subscription:', subError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen des Abonnements' },
        { status: 500 }
      )
    }

    // Erstelle Lead
    await supabase
      .from('vamosgolf_leads')
      .insert({
        email: email.toLowerCase(),
        full_name,
        lead_type: 'newsletter',
        source: source || 'unknown',
        status: 'new',
      })

    return NextResponse.json({ success: true, message: 'Erfolgreich angemeldet' })
  } catch (error: any) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Anmelden' },
      { status: 500 }
    )
  }
}

