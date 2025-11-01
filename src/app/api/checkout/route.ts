import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30",
});

export async function POST(req: Request) {
  try {
    const { trip_id, user_id, trip_date_id, amount_cents } = await req.json();

    if (!amount_cents || amount_cents <= 0) {
      console.error("❌ Kein Betrag übergeben:", amount_cents);
      return NextResponse.json(
        { error: "Ungültiger oder fehlender Betrag" },
        { status: 400 }
      );
    }

    // Session erstellen
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "VamosGolf Reisebuchung",
              description: "Golfreise oder Paket",
            },
            unit_amount: amount_cents, // Betrag in Cent!
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
      metadata: {
        trip_id,
        user_id,
        trip_date_id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe-Fehler:", error);
    return NextResponse.json(
      { error: "Stripe checkout failed" },
      { status: 500 }
    );
  }
}
