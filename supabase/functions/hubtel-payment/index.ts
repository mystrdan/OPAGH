import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

const HUBTEL_BASE_URL = Deno.env.get("HUBTEL_BASE_URL") ?? "https://payproxyapi.hubtel.com";
const HUBTEL_CLIENT_ID = Deno.env.get("HUBTEL_CLIENT_ID");
const HUBTEL_CLIENT_SECRET = Deno.env.get("HUBTEL_CLIENT_SECRET");
const HUBTEL_RETURN_URL = Deno.env.get("HUBTEL_RETURN_URL");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function basicAuth(id: string, secret: string) {
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

function reference(orderId: string) {
  return `JSI-${orderId.replaceAll("-", "").slice(0, 20)}`;
}

Deno.serve(async (req) => {
  const { client, supabaseAdmin, user } = withSupabase(req, { auth: "user" });

  if (!user) return json({ error: "Unauthorized" }, 401);
  if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET || !HUBTEL_RETURN_URL) {
    return json({ error: "Hubtel payment integration is not configured on JSI yet." }, 503);
  }

  let body: { action?: "initialize" | "status"; orderId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  if (!body.action || !body.orderId) {
    return json({ error: "action and orderId are required." }, 400);
  }

  const { data: order, error: orderError } = await client
    .from("orders")
    .select("id,user_id,amount,currency,status,item_description")
    .eq("id", body.orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) return json({ error: "Order not found." }, 404);
  if (order.currency !== "GHS") return json({ error: "Only GHS payments are currently supported." }, 400);

  if (body.action === "initialize") {
    if (!order.amount || Number(order.amount) <= 0) {
      return json({ error: "This order does not have a payable delivery amount yet." }, 409);
    }
    if (order.status !== "awaiting_payment") {
      return json({ error: `Order cannot be paid from status: ${order.status}.` }, 409);
    }

    const paymentReference = reference(order.id);

    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id,reference,provider_transaction_id,checkout_url,status,amount,currency")
      .eq("order_id", order.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing?.checkout_url) {
      return json({ payment: existing });
    }

    const payload = {
      InvoiceId: paymentReference,
      TotalAmount: Number(order.amount),
      Description: `JSI delivery ${order.id}`,
      CustomerName: "JSI Customer",
      CustomerMsisdn: user.phone?.replace(/^\+/, "") ?? undefined,
      PrimaryCallbackUrl: "",
      ReturnUrl: HUBTEL_RETURN_URL,
    };

    const response = await fetch(`${HUBTEL_BASE_URL}/items/initiate`, {
      method: "POST",
      headers: {
        Authorization: basicAuth(HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ResponseCode !== "00" || !result?.Data?.CheckoutUrl) {
      return json({
        error: "Hubtel could not initialize the payment.",
        providerStatus: response.status,
        providerResponse: result,
      }, 502);
    }

    const providerData = result.Data;
    const { data: payment, error: paymentError } = await client
      .from("payments")
      .insert({
        order_id: order.id,
        provider: "hubtel",
        reference: paymentReference,
        provider_transaction_id: providerData.TransactionId ?? null,
        amount: Number(order.amount),
        currency: order.currency,
        status: "pending",
        checkout_url: providerData.CheckoutUrl,
        provider_status: "Pending",
        metadata: providerData,
      })
      .select("id,reference,provider_transaction_id,checkout_url,status,amount,currency")
      .single();

    if (paymentError) return json({ error: "Payment was initialized but could not be recorded." }, 500);
    return json({ payment });
  }

  const { data: payment, error: paymentError } = await client
    .from("payments")
    .select("id,reference,provider_transaction_id,status,amount,currency")
    .eq("order_id", order.id)
    .eq("provider", "hubtel")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError || !payment) return json({ error: "No Hubtel payment exists for this order." }, 404);

  if (!payment.provider_transaction_id) {
    return json({ payment });
  }

  const response = await fetch(
    `${HUBTEL_BASE_URL}/transaction/${encodeURIComponent(payment.provider_transaction_id)}`,
    {
      headers: {
        Authorization: basicAuth(HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET),
        Accept: "application/json",
      },
    },
  );

  const result = await response.json().catch(() => null);
  if (!response.ok || result?.ResponseCode !== "00") {
    return json({ error: "Could not retrieve Hubtel payment status.", providerStatus: response.status }, 502);
  }

  const providerStatus = String(result?.Data?.Status ?? "Unknown");
  const normalized = providerStatus.toLowerCase();
  const paid = normalized === "completed" || normalized === "success" || normalized === "successful";
  const failed = normalized === "failed" || normalized === "cancelled" || normalized === "canceled";

  const nextPaymentStatus = paid ? "paid" : failed ? (normalized.includes("cancel") ? "cancelled" : "failed") : "pending";
  const nextOrderStatus = paid ? "paid" : failed ? "failed" : order.status;

  const { error: updateError } = await client
    .from("payments")
    .update({
      status: nextPaymentStatus,
      provider_status: providerStatus,
      metadata: result?.Data ?? result,
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", payment.id);

  if (updateError) return json({ error: "Payment status could not be recorded." }, 500);

  if (paid && order.status === "awaiting_payment") {
    await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);
  } else if (failed && order.status === "awaiting_payment") {
    await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
  }

  return json({
    payment: {
      ...payment,
      status: nextPaymentStatus,
      provider_status: providerStatus,
    },
    orderStatus: nextOrderStatus,
  });
});
