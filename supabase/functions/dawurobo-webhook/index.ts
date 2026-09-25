import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("DAWUROBO_WEBHOOK_SECRET");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function normalizeStatus(event: string, data: Record<string, unknown>) {
  const explicit = typeof data.status === "string" ? data.status : "";
  const value = explicit || event.replace(/^order\./, "");
  const map: Record<string, string> = {
    created: "paid",
    accepted: "in_transit",
    picked_up: "in_transit",
    pickedUp: "in_transit",
    in_transit: "in_transit",
    delivered: "delivered",
    cancelled: "cancelled",
    rejected: "failed",
    returned: "failed",
    rescheduled: "in_transit",
  };
  return map[value] ?? null;
}

function extractOrderId(data: Record<string, unknown>) {
  const candidates = [
    data.order_id,
    data.provider_delivery_id,
    (data.order as Record<string, unknown> | undefined)?.order_id,
    (data.order_details as Record<string, unknown> | undefined)?.order_id,
  ];
  return candidates.find((v): v is string => typeof v === "string" && v.length > 0) ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!WEBHOOK_SECRET) return new Response("Webhook is not configured", { status: 503);

  const rawBody = await req.text();
  const signature = req.headers.get("X-Webhook-Signature") ?? "";
  const timestamp = req.headers.get("X-Webhook-Timestamp") ?? "";

  if (!timestamp) return new Response("Missing webhook timestamp", { status: 401 });
  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return new Response("Stale webhook", { status: 401 });
  }

  const expected = await hmacHex(WEBHOOK_SECRET, rawBody);
  if (!constantTimeEqual(expected, signature)) return new Response("Invalid webhook signature", { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : "";
  const data = (body.data && typeof body.data === "object" ? body.data : {}) as Record<string, unknown>;
  const providerDeliveryId = extractOrderId(data);
  if (!providerDeliveryId) return new Response("OK", { status: 200 });

  const { data: order } = await admin
    .from("orders")
    .select("id,user_id,status,provider_delivery_id")
    .eq("provider_delivery_id", providerDeliveryId)
    .maybeSingle();

  if (!order) return new Response("OK", { status: 200 });

  const nextStatus = normalizeStatus(event, data);
  const statusChanged = Boolean(nextStatus && nextStatus !== order.status);

  if (statusChanged) {
    await admin.from("orders").update({ status: nextStatus }).eq("id", order.id);
    await admin.from("order_events").insert({
      order_id: order.id,
      user_id: order.user_id,
      status: nextStatus,
      message: "Dawurobo update: " + event,
    });
  }

  const latitude =
    typeof data.latitude === "number" ? data.latitude :
    typeof data.lat === "number" ? data.lat :
    typeof (data.location as Record<string, unknown> | undefined)?.lat === "number"
      ? data.location as Record<string, unknown> && (data.location as Record<string, unknown>).lat as number
      : null;

  const longitude =
    typeof data.longitude === "number" ? data.longitude :
    typeof data.lng === "number" ? data.lng :
    typeof (data.location as Record<string, unknown> | undefined)?.lng === "number"
      ? (data.location as Record<string, unknown>).lng as number
      : null;

  let trackingLocationId: string | null = null;
  if (latitude !== null && longitude !== null) {
    const { data: tracking } = await admin
      .from("tracking_locations")
      .insert({
        order_id: order.id,
        status: nextStatus ?? event,
        latitude,
        longitude,
        accuracy: typeof data.accuracy === "number" ? data.accuracy : null,
        heading: typeof data.heading === "number" ? data.heading : null,
        speed: typeof data.speed === "number" ? data.speed : null,
        recorded_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    trackingLocationId = tracking?.id ?? null;
  }

  const notificationStatus = nextStatus ?? event;
  if (notificationStatus) {
    await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-tracking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        orderId: order.id,
        trackingLocationId,
        status: notificationStatus,
        latitude,
        longitude,
        recordedAt: new Date().toISOString(),
        statusChanged,
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
