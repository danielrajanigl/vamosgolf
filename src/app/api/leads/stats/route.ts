import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prüfe ob User Admin oder Editor ist
    const { data: profile } = await supabase
      .from('vamosgolf_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Hole Statistiken
    const [leadsTotal, leadsNew, newsletterTotal, contactTotal, inquiryTotal] = await Promise.all([
      supabase.from('vamosgolf_leads').select('id', { count: 'exact', head: true }),
      supabase.from('vamosgolf_leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('vamosgolf_newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('vamosgolf_contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('vamosgolf_booking_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ])

    // Leads nach Typ
    const leadsByType = await supabase
      .from('vamosgolf_leads')
      .select('lead_type')
    
    const typeCounts = (leadsByType.data || []).reduce((acc: any, lead: any) => {
      acc[lead.lead_type] = (acc[lead.lead_type] || 0) + 1
      return acc
    }, {})

    // Leads der letzten 30 Tage
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentLeads = await supabase
      .from('vamosgolf_leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    return NextResponse.json({
      total_leads: leadsTotal.count || 0,
      new_leads: leadsNew.count || 0,
      newsletter_subscribers: newsletterTotal.count || 0,
      new_contact_submissions: contactTotal.count || 0,
      new_booking_inquiries: inquiryTotal.count || 0,
      leads_by_type: typeCounts,
      recent_leads_30d: recentLeads.count || 0,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

