import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    const { 
      name, 
      email, 
      phone, 
      persons, 
      message, 
      preferred_contact,
      trip_id, 
      trip_date_id 
    } = await req.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name und E-Mail sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = await supabaseServer()

    // Erstelle Booking Inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('vamosgolf_booking_inquiries')
      .insert({
        email: email.toLowerCase(),
        full_name: name,
        phone: phone || null,
        trip_id: trip_id || null,
        trip_date_id: trip_date_id || null,
        persons: persons || 1,
        message: message || null,
        preferred_contact_method: preferred_contact || 'email',
        status: 'new',
      })
      .select()
      .single()

    if (inquiryError) {
      console.error('Error creating booking inquiry:', inquiryError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Buchungsanfrage' },
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
        lead_type: 'booking_inquiry',
        source: trip_id ? 'trip-detail' : 'unknown',
        status: 'new',
        metadata: {
          trip_id,
          trip_date_id,
          persons,
          preferred_contact,
        },
      })

    return NextResponse.json({ 
      success: true, 
      message: 'Buchungsanfrage gesendet',
      inquiry_id: inquiry.id 
    })
  } catch (error: any) {
    console.error('Booking inquiry error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Senden' },
      { status: 500 }
    )
  }
}

