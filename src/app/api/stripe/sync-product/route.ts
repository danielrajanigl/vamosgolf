import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { trip_id } = await req.json();
    if (!trip_id) {
      return NextResponse.json({ error: "trip_id fehlt" }, { status: 400 });
    }

    // 1️⃣ Reise aus Supabase holen
    const { data: trip, error } = await supabase
      .from("vamosgolf_trips")
      .select("*")
      .eq("id", trip_id)
      .single();

    if (error || !trip) {
      console.error("❌ Reise nicht gefunden:", error);
      return NextResponse.json(
        { error: "Reise nicht gefunden" },
        { status: 404 }
      );
    }

    // 2️⃣ Stripe-Produkt prüfen oder neu anlegen
    let stripeProductId = trip.stripe_product_id;
    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: trip.title?.en || trip.title?.de || "VamosGolf Reise",
        description: trip.description?.en || trip.description?.de || "",
        images: trip.image_url ? [trip.image_url] : [],
      });
      stripeProductId = product.id;
    }

    // 3️⃣ Preis prüfen oder neu anlegen
    let stripePriceId = trip.stripe_price_id;
    if (!stripePriceId) {
      const price = await stripe.prices.create({
        product: stripeProductId,
        currency: trip.currency || "eur",
        unit_amount: trip.base_price_cents,
      });
      stripePriceId = price.id;
    }

    // 4️⃣ Supabase aktualisieren
    const { error: updateError } = await supabase
      .from("vamosgolf_trips")
      .update({
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      })
      .eq("id", trip_id);

    if (updateError) {
      console.error("❌ Fehler beim Update:", updateError);
      return NextResponse.json(
        { error: "Datenbankupdate fehlgeschlagen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
    });
  } catch (err) {
    console.error("❌ Stripe-Sync Fehler:", err);
    return NextResponse.json(
      { error: "Stripe Sync fehlgeschlagen" },
      { status: 500 }
    );
  }
}
