import { withSupabase } from "npm:@supabase/server@^1";

const BASE_URL = Deno.env.get("DAWUROBO_BASE_URL") ?? "https://delivery.dawurobo.com";

async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  fetch: withSupabase({ auth: "secret" }, async (req, ctx) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const apiKey = Deno.env.get("DAWUROBO_API_KEY");
    const signingSecret = Deno.env.get("DAWUROBO_SIGNING_SECRET");
    if (!apiKey || !signingSecret) return Response.json({ error: "Dawurobo integration is not configured on JSI yet." }, { status: 503 });

    const input = await req.json().catch(() => ({}));
    const orderId = typeof input.orderId === "string" ? input.orderId : "";
    if (!orderId) return Response.json({ error: "orderId is required." }, { status: 400 });

    const { data: order } = await ctx.supabaseAdmin.from("orders")
      .select("id,user_id,status,item_description,provider_delivery_id,pickup_address_id,destination_address_id")
      .eq("id", orderId).single();

    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== "paid" && order.status !== "creating_delivery") return Response.json({ error: "Order cannot be dispatched from its current status." }, { status: 409 });
    if (order.provider_delivery_id) return Response.json({ ok: true, alreadyCreated: true, providerDeliveryId: order.provider_delivery_id });

    const [{ data: pickup }, { data: destination }, { data: profile }] = await Promise.all([
      ctx.supabaseAdmin.from("addresses").select("address,digital_address,landmark,latitude,longitude").eq("id", order.pickup_address_id).eq("user_id", order.user_id).single(),
      ctx.supabaseAdmin.from("addresses").select("address,digital_address,landmark,latitude,longitude").eq("id", order.destination_address_id).eq("user_id", order.user_id).single(),
      ctx.supabaseAdmin.from("profiles").select("phone").eq("id", order.user_id).single(),
    ]);

    if (!pickup || !destination) return Response.json({ error: "Pickup or destination address is missing." }, { status: 409 });
    if (pickup.latitude == null || pickup.longitude == null || destination.latitude == null || destination.longitude == null) return Response.json({ error: "Verified pickup and destination coordinates are required for provider dispatch." }, { status: 409 });
    if (!profile?.phone) return Response.json({ error: "Customer phone number is missing." }, { status: 409 });

    await ctx.supabaseAdmin.from("orders").update({ status: "creating_delivery" }).eq("id", order.id).eq("status", "paid");

    const addressText = (a: typeof pickup) => [a.address, a.digital_address, a.landmark].filter(Boolean).join(", ");
    const payload = {
      order_reference: "JSI-" + order.id.replaceAll("-", "").slice(0, 20),
      customer: { name: "JSI Customer", phone: profile.phone },
      delivery: { address: addressText(destination), coordinates: { lat: Number(destination.latitude), lng: Number(destination.longitude) } },
      pickup: { address: addressText(pickup), contact_person: "JSI Customer", contact_phone: profile.phone, coordinates: { lat: Number(pickup.latitude), lng: Number(pickup.longitude) } },
      item: order.item_description,
      payment: { payer: "recipient" },
    };

    const path = "/api/v1/delivery/orders.create";
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

    if (!response.ok) {
      await ctx.supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id).eq("status", "creating_delivery");
      return Response.json({ error: "Dawurobo delivery creation failed.", providerStatus: response.status, providerResponse: result }, { status: 502 });
    }

    const root = result as Record<string, unknown>;
    const nested = (root.data && typeof root.data === "object" ? root.data : {}) as Record<string, unknown>;
    const details = (nested.order_details && typeof nested.order_details === "object" ? nested.order_details : {}) as Record<string, unknown>;
    const providerDeliveryId = typeof details.order_id === "string" ? details.order_id : null;

    if (!providerDeliveryId) {
      await ctx.supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id).eq("status", "creating_delivery");
      return Response.json({ error: "Dawurobo returned no provider order ID." }, { status: 502 });
    }

    await ctx.supabaseAdmin.from("orders").update({ provider_delivery_id: providerDeliveryId, status: "in_transit" }).eq("id", order.id);
    return Response.json({ ok: true, providerDeliveryId });
  }),
};
