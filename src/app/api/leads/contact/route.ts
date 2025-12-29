import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message, source } = await req.json()

    if (!email || !name || !subject || !message) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = await supabaseServer()

    // Erstelle Contact Submission
    const { data: contact, error: contactError } = await supabase
      .from('vamosgolf_contact_submissions')
      .insert({
        email: email.toLowerCase(),
        full_name: name,
        phone: phone || null,
        subject,
        message,
        source: source || 'unknown',
        status: 'new',
      })
      .select()
      .single()

    if (contactError) {
      console.error('Error creating contact submission:', contactError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Kontaktanfrage' },
        { status: 500 }
      )
    }

    // Erstelle Lead
    await supabase
      .from('vamosgolf_leads')
      .insert({
        email: email.toLowerCase(),
        full_name: name,
        phone: phone || null,
        lead_type: 'contact',
        source: source || 'unknown',
        status: 'new',
        metadata: {
          subject,
          message_preview: message.substring(0, 200),
        },
      })

    return NextResponse.json({ success: true, message: 'Kontaktanfrage gesendet' })
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Senden' },
      { status: 500 }
    )
  }
}

