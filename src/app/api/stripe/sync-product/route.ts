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
    const { trip_id, stripe_product_id: overrideStripeProductId, stripe_price_id: overrideStripePriceId } = await req.json();
    if (!trip_id) {
      return NextResponse.json({ error: "trip_id fehlt" }, { status: 400 });
    }

    // 1️⃣ Reise holen (inkl. Produkt-Verknüpfung)
    const { data: trip, error: tripError } = await supabase
      .from("vamosgolf_trips")
      .select("*, product_id")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      console.error("❌ Reise nicht gefunden:", tripError);
      return NextResponse.json({ error: "Reise nicht gefunden" }, { status: 404 });
    }

    if ((!trip.base_price_cents || trip.base_price_cents <= 0) && !overrideStripePriceId) {
      return NextResponse.json(
        { error: "Reise benötigt einen Basispreis" },
        { status: 400 }
      );
    }

    const titleText =
      (typeof trip.title === "object"
        ? trip.title?.de || trip.title?.en || Object.values(trip.title ?? {})?.[0]
        : trip.title) || "VamosGolf Reise";

    const descriptionText =
      (typeof trip.description === "object"
        ? trip.description?.de || trip.description?.en || Object.values(trip.description ?? {})?.[0]
        : trip.description) || "";

    // 2️⃣ Stripe-Produkt synchronisieren
    let stripeProductId: string | null = overrideStripeProductId ?? trip.stripe_product_id ?? null;
    let productMeta: Stripe.Product | null = null;

    if (stripeProductId && !overrideStripeProductId) {
      try {
        productMeta = await stripe.products.retrieve(stripeProductId);
      } catch (err) {
        console.warn("⚠️ Stripe Produkt nicht gefunden, wird neu erstellt", err);
        stripeProductId = null;
      }
    }

    if (overrideStripeProductId) {
      try {
        productMeta = await stripe.products.retrieve(overrideStripeProductId);
      } catch (err) {
        console.error('❌ Angegebener Stripe Product nicht gefunden:', err)
        return NextResponse.json({ error: 'Stripe Produkt nicht gefunden' }, { status: 400 })
      }
      stripeProductId = overrideStripeProductId
    }

    if (!stripeProductId) {
      productMeta = await stripe.products.create({
        name: titleText,
        description: descriptionText,
        images: trip.image_url ? [trip.image_url] : undefined,
      });
      stripeProductId = productMeta.id;
    } else {
      // Produkt aktualisieren, falls nötig
      await stripe.products.update(stripeProductId, {
        name: titleText,
        description: descriptionText,
        images: trip.image_url ? [trip.image_url] : undefined,
      });
      if (!productMeta) {
        productMeta = await stripe.products.retrieve(stripeProductId);
      }
    }

    // 3️⃣ Stripe-Preis synchronisieren
    let stripePriceId: string | null = overrideStripePriceId ?? trip.stripe_price_id ?? null;
    let stripePrice: Stripe.Price | null = null;

    if (stripePriceId && !overrideStripePriceId) {
      try {
        stripePrice = await stripe.prices.retrieve(stripePriceId);
      } catch (err) {
        console.warn("⚠️ Stripe Preis nicht gefunden, wird neu erstellt", err);
        stripePriceId = null;
      }
    }

    if (!stripePriceId && stripeProductId) {
      if (overrideStripeProductId) {
        const priceList = await stripe.prices.list({ product: stripeProductId, active: true, limit: 1 })
        stripePrice = priceList.data[0] || null
        stripePriceId = stripePrice?.id || null
      }
    }

    if (!stripePriceId) {
      if (!trip.base_price_cents || trip.base_price_cents <= 0) {
        return NextResponse.json({ error: 'Kein Basispreis für Stripe vorhanden.' }, { status: 400 })
      }

      const price = await stripe.prices.create({
        product: stripeProductId!,
        currency: (trip.currency || "EUR").toLowerCase(),
        unit_amount: trip.base_price_cents,
        nickname: `${titleText} Basispreis`,
      });
      stripePriceId = price.id;
      stripePrice = price;
    }

    if (!stripePrice && stripePriceId) {
      stripePrice = await stripe.prices.retrieve(stripePriceId);
    }

    // 4️⃣ Produkt in Supabase spiegeln
    // Determine type (main or addon) from Stripe metadata or trip context
    const stripeMetadata: Record<string, any> = productMeta?.metadata || {};
    const productType = stripeMetadata.type === 'addon' ? 'addon' : 'reise';
    const parentProductSlug = stripeMetadata.parent_product || null;
    const productSlug = productType === 'addon'
      ? (stripeMetadata.slug || `${trip.slug}-addon-${(stripeProductId || '').slice(-6)}`)
      : trip.slug;
    const parentProductId = parentProductSlug
      ? (await supabase
          .from('products')
          .select('id')
          .eq('slug', parentProductSlug)
          .maybeSingle()).data?.id || null
      : trip.product_id || null;

    const isActive = trip.status === "published";

    const { data: upsertedProduct, error: productUpsertError } = await supabase
      .from("products")
      .upsert(
        {
          id: productType === 'reise' ? (trip.product_id || undefined) : undefined,
          slug: productSlug,
          title: productMeta?.name || titleText,
          type: productType,
          parent_product_id: productType === 'addon' ? parentProductId : null,
          description_md: productMeta?.description || descriptionText,
          cover_url: productType === 'addon' ? stripeMetadata.image_url || trip.image_url : trip.image_url,
          stripe_product_id: stripeProductId!,
          is_active: isActive,
          metadata: stripeMetadata,
        },
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (productUpsertError || !upsertedProduct) {
      console.error("❌ Fehler beim Upsert von products:", productUpsertError);
      return NextResponse.json({ error: "Produkt-Sync fehlgeschlagen" }, { status: 500 });
    }

    // 5️⃣ Preis in Supabase spiegeln
    const baseUnitAmount = stripePrice?.unit_amount ?? trip.base_price_cents ?? 0;
    const priceCurrency = (stripePrice?.currency || trip.currency || 'EUR').toUpperCase();

    const { data: upsertedPrice, error: priceUpsertError } = await supabase
      .from("prices")
      .upsert(
        {
          product_id: upsertedProduct.id,
          stripe_price_id: stripePriceId!,
          currency: priceCurrency,
          unit_amount: baseUnitAmount,
          interval: "onetime",
          nickname: `${titleText} Basispreis`,
          is_active: isActive,
        },
        { onConflict: "stripe_price_id" }
      )
      .select()
      .single();

    if (priceUpsertError || !upsertedPrice) {
      console.error("❌ Fehler beim Upsert von prices:", priceUpsertError);
      return NextResponse.json({ error: "Preis-Sync fehlgeschlagen" }, { status: 500 });
    }

    // 6️⃣ Trip aktualisieren (Produkt/Preis-Verknüpfung)
    if (productType === 'addon') {
      // ensure addon record exists
      const addonInsert = {
        product_id: upsertedProduct.id,
        trip_id: trip_id,
        title: productMeta?.name || titleText,
        description: productMeta?.description || descriptionText,
        stripe_price_id: stripePriceId!,
        price_delta_cents: trip.base_price_cents, // Assuming base_price_cents is the price delta for addons
        is_active: isActive,
      };

      const { error: addonError } = await supabase
        .from('addons')
        .upsert(addonInsert, { onConflict: 'product_id' });

      if (addonError) {
        console.error('⚠️ Fehler beim Upsert der Add-ons:', addonError);
      }
    } else {
      const { error: tripUpdateError } = await supabase
        .from("vamosgolf_trips")
        .update({
          product_id: upsertedProduct.id,
          stripe_product_id: stripeProductId!,
          stripe_price_id: stripePriceId!,
        })
        .eq("id", trip_id);

      if (tripUpdateError) {
        console.error("❌ Fehler beim Aktualisieren der Reise:", tripUpdateError);
        return NextResponse.json({ error: "Trip-Update fehlgeschlagen" }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      product_id: upsertedProduct.id,
      price_id: upsertedPrice.id,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
    });
  } catch (error: any) {
    console.error("❌ Stripe Sync Fehler:", error);
    return NextResponse.json(
      { error: error?.message || "Stripe Sync fehlgeschlagen" },
      { status: 500 }
    );
  }
}
