import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-09-30.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id)
    return NextResponse.json({ success: false }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.payment_status !== "paid")
    return NextResponse.json({ success: false }, { status: 400 });

  const { user_id, trip_date_id } = session.metadata as any;

  await supabase
    .from("vamosgolf_bookings")
    .update({ payment_status: "paid" })
    .eq("stripe_checkout_session_id", session.id);

  await supabase.rpc("vamosgolf_increment_date_bookings", {
    p_trip_date_id: trip_date_id,
    p_inc: 1,
  });

  return NextResponse.json({ success: true });
}
