import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Supabase client (server-side only — uses service role key)
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Map Paddle price ID → plan name
// ---------------------------------------------------------------------------
const PRICE_TO_PLAN: Record<string, string> = {
  pri_01kk7g7whpssf3kxm8wvcth4th: "basic",
  pri_01kk7ggah21arxbmy0j9bct4hx: "pro",
  pri_01kk7gj7v1k6x1egznqr98yhc1: "premium",
};

function planFromPriceId(priceId?: string): string {
  return (priceId && PRICE_TO_PLAN[priceId]) ?? "unknown";
}

// ---------------------------------------------------------------------------
// Paddle webhook signature verification
// ---------------------------------------------------------------------------
function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq !== -1) parts[part.slice(0, eq)] = part.slice(eq + 1);
  }

  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (age > 300) {
    console.warn("[Paddle Webhook] Timestamp too old:", age, "seconds");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  if (expected.length !== h1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(h1, "hex"));
}

// ---------------------------------------------------------------------------
// POST /api/paddle/webhook
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Paddle Webhook] PADDLE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  const signatureHeader = req.headers.get("Paddle-Signature");
  if (!signatureHeader) {
    console.warn("[Paddle Webhook] Missing Paddle-Signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  if (!verifyPaddleSignature(rawBody, signatureHeader, secret)) {
    console.warn("[Paddle Webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType: string = event?.event_type ?? "unknown";
  const eventId: string = event?.notification_id ?? "no-id";
  console.log(`[Paddle Webhook] event=${eventType} id=${eventId}`);

  try {
    const supabase = getSupabase();

    switch (eventType) {

      // ── Subscription created ───────────────────────────────────────────
      case "subscription.created": {
        const sub = event.data;
        const priceId: string = sub?.items?.[0]?.price?.id ?? "";
        const email: string =
          sub?.customer?.email ?? sub?.custom_data?.email ?? "";

        const { error } = await supabase.from("subscriptions").insert({
          customer_email:    email,
          subscription_id:   sub?.id,
          plan:              planFromPriceId(priceId),
          status:            sub?.status ?? "active",
          next_billing_date: sub?.next_billed_at ?? null,
        });

        if (error) console.error("[Paddle] subscription.created DB error:", error.message);
        else console.log(`[Paddle] subscription.created saved — subId=${sub?.id} plan=${planFromPriceId(priceId)}`);
        break;
      }

      // ── Subscription updated ───────────────────────────────────────────
      case "subscription.updated": {
        const sub = event.data;
        const priceId: string = sub?.items?.[0]?.price?.id ?? "";

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status:            sub?.status,
            plan:              planFromPriceId(priceId) !== "unknown"
                                 ? planFromPriceId(priceId)
                                 : undefined,
            next_billing_date: sub?.next_billed_at ?? null,
          })
          .eq("subscription_id", sub?.id);

        if (error) console.error("[Paddle] subscription.updated DB error:", error.message);
        else console.log(`[Paddle] subscription.updated — subId=${sub?.id} status=${sub?.status}`);
        break;
      }

      // ── Subscription canceled ──────────────────────────────────────────
      case "subscription.canceled": {
        const sub = event.data;

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("subscription_id", sub?.id);

        if (error) console.error("[Paddle] subscription.canceled DB error:", error.message);
        else console.log(`[Paddle] subscription.canceled — subId=${sub?.id}`);
        break;
      }

      // ── Transaction completed ──────────────────────────────────────────
      // Used to backfill the customer email once the first payment goes through
      case "transaction.completed": {
        const tx = event.data;
        const subId: string = tx?.subscription_id ?? "";
        const email: string = tx?.customer?.email ?? "";

        if (subId && email) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ customer_email: email })
            .eq("subscription_id", subId)
            .eq("customer_email", ""); // only overwrite if still empty

          if (error) console.error("[Paddle] transaction.completed email backfill error:", error.message);
          else console.log(`[Paddle] transaction.completed — email saved for subId=${subId}`);
        }
        break;
      }

      default:
        console.log(`[Paddle Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err: any) {
    console.error("[Paddle Webhook] Unexpected error:", err?.message ?? err);
    // Still return 200 so Paddle does not keep retrying
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
