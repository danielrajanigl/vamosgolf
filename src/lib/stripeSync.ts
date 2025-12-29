import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe } from "./stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SupabaseProduct = {
  id: string;
  type: "reise" | "addon" | "training" | "mitgliedschaft" | "video";
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function listAllPrices(productId: string) {
  let prices: Stripe.Price[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;

  while (hasMore) {
    const response = await stripe.prices.list({
      product: productId,
      limit: 100,
      starting_after: startingAfter,
      expand: ["data.transform_quantity"],
    });

    prices = prices.concat(response.data);
    hasMore = response.has_more;
    if (hasMore) {
      startingAfter = response.data[response.data.length - 1]?.id;
    }
  }

  return prices;
}

async function resolveParentProductId(parentSlug?: string | null) {
  if (!parentSlug) return null;

  const { data: parentProduct } = await supabase
    .from("products")
    .select("id")
    .eq("slug", parentSlug)
    .maybeSingle();

  if (parentProduct?.id) {
    return parentProduct.id;
  }

  return null;
}

async function updateTripLinkForMainProduct(args: {
  slug?: string | null;
  productId: string;
  stripeProductId: string;
  primaryPriceId?: string | null;
}) {
  if (!args.slug) return;

  const { data: trip } = await supabase
    .from("vamosgolf_trips")
    .select("id")
    .eq("slug", args.slug)
    .maybeSingle();

  if (!trip?.id) return;

  await supabase
    .from("vamosgolf_trips")
    .update({
      product_id: args.productId,
      stripe_product_id: args.stripeProductId,
      stripe_price_id: args.primaryPriceId || null,
    })
    .eq("id", trip.id);
}

async function upsertAddonLink(args: {
  tripSlug?: string | null;
  productId: string;
  productTitle: string;
  productDescription?: string | null;
  prices: Stripe.Price[];
  active: boolean;
}) {
  if (!args.tripSlug) return;

  const { data: trip } = await supabase
    .from("vamosgolf_trips")
    .select("id")
    .eq("slug", args.tripSlug)
    .maybeSingle();

  if (!trip?.id) return;

  for (const price of args.prices) {
    const priceAmount = price.unit_amount ?? 0;
    const { data: existingAddon } = await supabase
      .from("addons")
      .select("id")
      .eq("stripe_price_id", price.id)
      .maybeSingle();

    const payload = {
      product_id: args.productId,
      trip_id: trip.id,
      title: args.productTitle,
      description: args.productDescription || "",
      stripe_price_id: price.id,
      price_delta_cents: priceAmount,
      is_active: args.active && price.active,
    };

    if (existingAddon?.id) {
      await supabase
        .from("addons")
        .update(payload)
        .eq("id", existingAddon.id);
    } else {
      await supabase.from("addons").insert(payload);
    }
  }

  // Add-ons die nicht mehr existieren deaktivieren
  const priceIds = args.prices.map((price) => price.id);
  if (priceIds.length > 0) {
    await supabase
      .from("addons")
      .update({ is_active: false })
      .eq("trip_id", trip.id)
      .eq("product_id", args.productId)
      .not("stripe_price_id", "in", priceIds);
  } else {
    await supabase
      .from("addons")
      .update({ is_active: false })
      .eq("trip_id", trip.id)
      .eq("product_id", args.productId);
  }
}

export async function syncStripeProductToSupabase(productId: string) {
  const product = await stripe.products.retrieve(productId);

  if (!product || product.deleted) {
    await deactivateStripeProduct(productId);
    return;
  }

  const metadata = product.metadata || {};

  const type = (metadata.type as SupabaseProduct["type"]) || "reise";
  const slug =
    metadata.slug ||
    slugify(product.name || productId) ||
    product.id.toLowerCase();
  const parentProductSlug =
    type === "addon" ? metadata.parent_product || null : null;

  let parentProductId: string | null = null;
  if (type === "addon") {
    parentProductId = await resolveParentProductId(parentProductSlug);
  }

  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("stripe_product_id", product.id)
    .maybeSingle();

  const productPayload = {
    id: existingProduct?.id,
    slug,
    title: product.name || slug,
    type,
    parent_product_id: parentProductId,
    description_md: product.description || null,
    cover_url: product.images?.[0] || null,
    stripe_product_id: product.id,
    is_active: product.active ?? true,
    metadata,
  };

  const { data: upsertedProduct } = await supabase
    .from("products")
    .upsert(productPayload, { onConflict: "stripe_product_id" })
    .select("id, type")
    .single();

  if (!upsertedProduct?.id) {
    return;
  }

  const prices = await listAllPrices(product.id);
  const priceIds = prices.map((price) => price.id);

  for (const price of prices) {
    const currency = price.currency?.toUpperCase() || "EUR";
    const unitAmount = price.unit_amount ?? 0;
    const interval = price.recurring?.interval || "onetime";

    await supabase
      .from("prices")
      .upsert(
        {
          product_id: upsertedProduct.id,
          stripe_price_id: price.id,
          currency,
          unit_amount: unitAmount,
          interval,
          nickname: price.nickname || null,
          is_active: price.active ?? true,
        },
        { onConflict: "stripe_price_id" }
      );
  }

  if (priceIds.length > 0) {
    await supabase
      .from("prices")
      .update({ is_active: false })
      .eq("product_id", upsertedProduct.id)
      .not("stripe_price_id", "in", priceIds);
  } else {
    await supabase
      .from("prices")
      .update({ is_active: false })
      .eq("product_id", upsertedProduct.id);
  }

  const primaryActivePrice =
    prices.find((price) => price.active) ?? prices[0] ?? null;

  if (upsertedProduct.type === "reise") {
    await updateTripLinkForMainProduct({
      slug,
      productId: upsertedProduct.id,
      stripeProductId: product.id,
      primaryPriceId: primaryActivePrice?.id || null,
    });
  }

  if (upsertedProduct.type === "addon") {
    await upsertAddonLink({
      tripSlug: parentProductSlug,
      productId: upsertedProduct.id,
      productTitle: product.name || slug,
      productDescription: product.description,
      prices,
      active: product.active ?? true,
    });
  }
}

export async function deactivateStripeProduct(productId: string) {
  const { data: productRow } = await supabase
    .from("products")
    .select("id, type")
    .eq("stripe_product_id", productId)
    .maybeSingle();

  if (!productRow?.id) {
    return;
  }

  await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productRow.id);

  await supabase
    .from("prices")
    .update({ is_active: false })
    .eq("product_id", productRow.id);

  if (productRow.type === "reise") {
    await supabase
      .from("vamosgolf_trips")
      .update({ stripe_price_id: null, stripe_product_id: null })
      .eq("product_id", productRow.id);
  } else if (productRow.type === "addon") {
    await supabase
      .from("addons")
      .update({ is_active: false })
      .eq("product_id", productRow.id);
  }
}

export async function deactivateStripePrice(priceId: string) {
  await supabase
    .from("prices")
    .update({ is_active: false })
    .eq("stripe_price_id", priceId);

  await supabase
    .from("addons")
    .update({ is_active: false })
    .eq("stripe_price_id", priceId);

  await supabase
    .from("vamosgolf_trips")
    .update({ stripe_price_id: null })
    .eq("stripe_price_id", priceId);
}


