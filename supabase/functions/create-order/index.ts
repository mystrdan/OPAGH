import { withSupabase } from "npm:@supabase/server@^1";

const BASE_URL = Deno.env.get("DAWUROBO_BASE_URL") ?? "https://delivery.dawurobo.com";

async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const apiKey = Deno.env.get("DAWUROBO_API_KEY");
    const signingSecret = Deno.env.get("DAWUROBO_SIGNING_SECRET");
    if (!apiKey || !signingSecret) {
      return Response.json({ error: "Dawurobo integration is not configured on JSI yet." }, { status: 503 });
    }

    const input = await req.json().catch(() => ({}));
    const mode = input.mode === "pick" ? "pick" : input.mode === "send" ? "send" : null;
    const pickupAddressId = typeof input.pickupAddressId === "string" ? input.pickupAddressId : "";
    const destinationAddressId = typeof input.destinationAddressId === "string" ? input.destinationAddressId : "";
    const item = typeof input.item === "string" ? input.item.trim() : "";

    if (!mode || !pickupAddressId || !destinationAddressId || !item) {
      return Response.json({ error: "mode, pickupAddressId, destinationAddressId and item are required." }, { status: 400 });
    }

    const [{ data: pickup }, { data: destination }, { data: provider }] = await Promise.all([
      ctx.supabase.from("addresses").select("id,address,digital_address,landmark,latitude,longitude").eq("id", pickupAddressId).eq("user_id", ctx.userClaims?.sub).single(),
      ctx.supabase.from("addresses").select("id,address,digital_address,landmark,latitude,longitude").eq("id", destinationAddressId).eq("user_id", ctx.userClaims?.sub).single(),
      ctx.supabase.from("providers").select("id,slug,name").eq("slug", "dawurobo").eq("active", true).maybeSingle(),
    ]);

    if (!pickup || !destination) return Response.json({ error: "Pickup or destination address was not found." }, { status: 404 });
    if (!provider) return Response.json({ error: "No active logistics provider is available yet." }, { status: 409 });
    if (pickup.latitude == null || pickup.longitude == null || destination.latitude == null || destination.longitude == null) {
      return Response.json({ error: "Verified pickup and destination coordinates are required." }, { status: 409 });
    }

    const payload = {
      pickup: { lat: Number(pickup.latitude), lng: Number(pickup.longitude) },
      delivery: { lat: Number(destination.latitude), lng: Number(destination.longitude) },
    };
    const path = "/api/v1/delivery/orders.estimate";
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const canonical = ["POST", path, "", await sha256Hex(body), timestamp, nonce].join("\n");
    const signature = await hmacHex(signingSecret, canonical);

    const response = await fetch(BASE_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey, "X-Signature": signature, "X-Timestamp": timestamp, "X-Nonce": nonce },
      body,
    });

    const raw = await response.text();
    let result: unknown = raw;
    try { result = JSON.parse(raw); } catch {}

    if (!response.ok) return Response.json({ error: "Could not verify the delivery price with the provider.", providerStatus: response.status }, { status: 502 });

    const root = result as Record<string, unknown>;
    const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
    const amount = Number(data.estimated_price ?? data.estimatedPrice ?? data.price);
    const currency = String(data.currency ?? "GHS");

    if (!Number.isFinite(amount) || amount <= 0 || currency !== "GHS") {
      return Response.json({ error: "The provider did not return a valid GHS delivery price." }, { status: 502 });
    }

    const { data: order, error: orderError } = await ctx.supabase.from("orders").insert({
      user_id: ctx.userClaims?.sub,
      mode,
      pickup_address_id: pickup.id,
      destination_address_id: destination.id,
      item_description: item,
      provider_id: provider.id,
      amount,
      currency,
      status: "awaiting_payment",
    }).select("id,status,amount,currency,provider_id").single();

    if (orderError || !order) return Response.json({ error: "Could not create the delivery request." }, { status: 500 });

    return Response.json({ ok: true, order, quote: { providerId: provider.slug, providerName: provider.name, amount, currency } });
  }),
};
