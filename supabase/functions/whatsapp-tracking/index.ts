import { withSupabase } from "npm:@supabase/server@^1";

const SENT_BASE_URL = Deno.env.get("SENT_DM_BASE_URL") ?? "https://api.sent.dm";
const SENT_API_KEY = Deno.env.get("SENT_DM_API_KEY");
const SENT_TEMPLATE = Deno.env.get("SENT_DM_TRACKING_TEMPLATE") ?? "jsi_delivery_tracking_update";

type Input = {
  orderId?: string;
  trackingLocationId?: string | null;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  recordedAt?: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function locationText(latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null) return "Location not available yet.";
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function mapUrl(latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

export default {
  fetch: withSupabase({ auth: "secret" }, async (req, ctx) => {
    if (!SENT_API_KEY) {
      return json({ error: "WhatsApp integration is not configured on JSI yet." }, 503);
    }

    let input: Input;
    try {
      input = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    if (!input.orderId || !input.status) {
      return json({ error: "orderId and status are required." }, 400);
    }

    const { data: order, error: orderError } = await ctx.supabaseAdmin
      .from("orders")
      .select("id,user_id")
      .eq("id", input.orderId)
      .single();

    if (orderError || !order) return json({ error: "Order not found." }, 404);

    const { data: profile } = await ctx.supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("id", order.user_id)
      .maybeSingle();

    if (!profile?.phone) {
      return json({ skipped: true, reason: "User has no phone number on profile." });
    }

    const trackingLocationId = input.trackingLocationId ?? null;
    const dedupeKey = trackingLocationId
      ? `${input.orderId}:tracking:${trackingLocationId}`
      : `${input.orderId}:status:${input.status}`;

    const { data: existing } = await ctx.supabaseAdmin
      .from("whatsapp_notifications")
      .select("id,status,provider_message_id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existing) return json({ skipped: true, notification: existing });

    const latitude = typeof input.latitude === "number" ? input.latitude : null;
    const longitude = typeof input.longitude === "number" ? input.longitude : null;
    const location = locationText(latitude, longitude);
    const trackingUrl = mapUrl(latitude, longitude);

    const { data: notification, error: insertError } = await ctx.supabaseAdmin
      .from("whatsapp_notifications")
      .insert({
        order_id: input.orderId,
        user_id: order.user_id,
        tracking_location_id: trackingLocationId,
        notification_type: "tracking_update",
        dedupe_key: dedupeKey,
        status: "pending",
        payload: {
          status: input.status,
          latitude,
          longitude,
          recordedAt: input.recordedAt ?? new Date().toISOString(),
        },
      })
      .select("id,status")
      .single();

    if (insertError || !notification) {
      return json({ error: "Could not create WhatsApp notification record." }, 500);
    }

    const idempotencyKey = `jsi-whatsapp-${dedupeKey.replace(/[^A-Za-z0-9_-]/g, "-")}`;

    try {
      const response = await fetch(`${SENT_BASE_URL}/v3/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SENT_API_KEY,
          "Idempotency-Key": idempotencyKey.slice(0, 255),
        },
        body: JSON.stringify({
          to: [profile.phone],
          channel: ["whatsapp"],
          template: {
            name: SENT_TEMPLATE,
            parameters: {
              order_id: input.orderId,
              status: input.status,
              location,
              tracking_url: trackingUrl,
            },
          },
        }),
      });

      const result = await response.json().catch(() => null);
      const messageId = result?.recipients?.[0]?.message_id ?? null;

      if (!response.ok) {
        await ctx.supabaseAdmin
          .from("whatsapp_notifications")
          .update({
            status: "failed",
            error: typeof result === "string" ? result : JSON.stringify(result),
          })
          .eq("id", notification.id);

        return json({ error: "WhatsApp notification was not accepted.", providerStatus: response.status }, 502);
      }

      await ctx.supabaseAdmin
        .from("whatsapp_notifications")
        .update({
          status: "accepted",
          provider_message_id: messageId,
          sent_at: new Date().toISOString(),
        })
        .eq("id", notification.id);

      return json({
        accepted: true,
        notificationId: notification.id,
        providerMessageId: messageId,
      }, 202);
    } catch (error) {
      await ctx.supabaseAdmin
        .from("whatsapp_notifications")
        .update({
          status: "failed",
          error: error instanceof Error ? error.message : "WhatsApp request failed.",
        })
        .eq("id", notification.id);

      return json({ error: "WhatsApp notification request failed." }, 502);
    }
  }),
};
