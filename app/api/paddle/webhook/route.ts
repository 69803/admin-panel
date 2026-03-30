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
// Compute access_until: day 29 of the month prior to next_billing_date.
// If that date is already in the past (e.g. client paid on day 30 renewing
// for next month), fall back to day 29 of next_billing_date's own month.
// Examples:
//   next_billing = 2026-04-15, today = 2026-03-05 → "2026-03-29"
//   next_billing = 2026-04-30, today = 2026-03-30 → "2026-04-29" (prior month already past)
// ---------------------------------------------------------------------------
function toAccessUntil(nextBilledAt: string | null | undefined): string | null {
  if (!nextBilledAt) return null;
  const d = new Date(nextBilledAt);
  if (isNaN(d.getTime())) return null;

  // Day 29 of the month before next billing
  const prevYear  = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  const prevMonth = d.getMonth() === 0 ? 12 : d.getMonth(); // prior month, 1-indexed
  const candidate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-29`;

  // If candidate is already past today, the client just renewed for next cycle
  // → use day 29 of next_billing_date's own month instead
  const today = new Date().toISOString().slice(0, 10);
  if (candidate < today) {
    const sameYear  = d.getFullYear();
    const sameMonth = d.getMonth() + 1; // 1-indexed
    return `${sameYear}-${String(sameMonth).padStart(2, "0")}-29`;
  }

  return candidate;
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

  // Set PADDLE_SKIP_SIG_VERIFY=true in env to bypass signature check during testing/simulations
  const skipSigVerify = process.env.PADDLE_SKIP_SIG_VERIFY === "true";

  if (!skipSigVerify) {
    const signatureHeader = req.headers.get("Paddle-Signature");
    if (!signatureHeader) {
      console.warn("[Paddle Webhook] Missing Paddle-Signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!verifyPaddleSignature(rawBody, signatureHeader, secret)) {
      console.warn("[Paddle Webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.log("[Paddle Webhook] Signature verification skipped (PADDLE_SKIP_SIG_VERIFY=true)");
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
  console.log("[Paddle Webhook] full payload:", JSON.stringify(event));

  try {
    const supabase = getSupabase();

    switch (eventType) {

      // ── Subscription created ───────────────────────────────────────────
      case "subscription.created": {
        const sub = event.data ?? event;
        const priceId: string =
          sub?.items?.[0]?.price?.id ?? sub?.items?.[0]?.price_id ?? "";
        const email: string =
          sub?.customer?.email ?? sub?.custom_data?.email ?? "";
        console.log(`[Paddle] subscription.created — customer_id=${sub?.customer_id} priceId=${priceId} items=`, JSON.stringify(sub?.items?.[0]));

        const { data, error } = await supabase.from("subscriptions").upsert(
          {
            ...(email ? { customer_email: email } : {}),
            subscription_id:   sub?.id,
            plan:              planFromPriceId(priceId),
            status:            sub?.status ?? "active",
            next_billing_date: sub?.next_billed_at ?? null,
            access_until:      toAccessUntil(sub?.next_billed_at),
          },
          { onConflict: "subscription_id" }
        ).select();

        console.log("UPSERT RESULT:", { data, error });
        if (error) {
          console.error("SUPABASE ERROR:", error);
          console.error("[Paddle] subscription.created DB error:", error.message);
        } else console.log(`[Paddle] subscription.created upserted — subId=${sub?.id} plan=${planFromPriceId(priceId)}`);
        break;
      }

      // ── Subscription activated ─────────────────────────────────────────
      case "subscription.activated": {
        const sub = event.data ?? event;
        const priceId: string =
          sub?.items?.[0]?.price?.id ?? sub?.items?.[0]?.price_id ?? "";
        const email: string =
          sub?.customer?.email ?? sub?.custom_data?.email ?? "";
        const rawNextBilled: string = sub?.next_billed_at ?? "";
        const computedAccessUntil = toAccessUntil(rawNextBilled || null);

        // Diagnostic — shows exactly what was extracted from Paddle payload
        console.log("[Paddle] subscription.activated EXTRACTED:", {
          subscription_id:   sub?.id,
          customer_id:       sub?.customer_id,
          email_found:       email || "(none — transaction.completed will backfill)",
          priceId,
          plan:              planFromPriceId(priceId),
          next_billed_at:    rawNextBilled,
          access_until:      computedAccessUntil,
        });

        const { data, error } = await supabase.from("subscriptions").upsert(
          {
            ...(email ? { customer_email: email } : {}),
            subscription_id:   sub?.id,
            plan:              planFromPriceId(priceId),
            status:            "active",
            next_billing_date: rawNextBilled || null,
            access_until:      computedAccessUntil,
          },
          { onConflict: "subscription_id" }
        ).select();

        console.log("[Paddle] subscription.activated UPSERT RESULT:", { data, error });
        if (error) {
          console.error("[Paddle] subscription.activated SUPABASE ERROR:", error);
        } else {
          console.log(`[Paddle] subscription.activated OK — subId=${sub?.id} access_until=${computedAccessUntil} rows=${data?.length}`);
        }
        break;
      }

      // ── Subscription updated ───────────────────────────────────────────
      case "subscription.updated": {
        const sub = event.data ?? event;
        const priceId: string =
          sub?.items?.[0]?.price?.id ?? sub?.items?.[0]?.price_id ?? "";

        const { data, error } = await supabase
          .from("subscriptions")
          .update({
            status:            sub?.status,
            plan:              planFromPriceId(priceId) !== "unknown"
                                 ? planFromPriceId(priceId)
                                 : undefined,
            next_billing_date: sub?.next_billed_at ?? null,
            access_until:      toAccessUntil(sub?.next_billed_at),
          })
          .eq("subscription_id", sub?.id)
          .select();

        console.log("UPSERT RESULT:", { data, error });
        if (error) {
          console.error("SUPABASE ERROR:", error);
          console.error("[Paddle] subscription.updated DB error:", error.message);
        } else console.log(`[Paddle] subscription.updated — subId=${sub?.id} status=${sub?.status}`);
        break;
      }

      // ── Subscription canceled ──────────────────────────────────────────
      case "subscription.canceled": {
        const sub = event.data ?? event;

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("subscription_id", sub?.id);

        if (error) console.error("[Paddle] subscription.canceled DB error:", error.message);
        else console.log(`[Paddle] subscription.canceled — subId=${sub?.id}`);
        break;
      }

      // ── Transaction completed ──────────────────────────────────────────
      // Backfills customer_email. Also upserts a partial row in case
      // this event fires before subscription.activated (race condition).
      case "transaction.completed": {
        const tx = event.data ?? event;
        const subId: string = tx?.subscription_id ?? "";

        // Paddle Billing puts email at different paths depending on context.
        // Try all known paths and log which one wins.
        const emailPaths = {
          "tx.customer.email":               tx?.customer?.email ?? "",
          "tx.details.contacts[0].email":    tx?.details?.contacts?.[0]?.email ?? "",
          "tx.custom_data.email":            tx?.custom_data?.email ?? "",
          "tx.billing_details.email":        tx?.billing_details?.email ?? "",
        };
        const email: string =
          emailPaths["tx.customer.email"] ||
          emailPaths["tx.details.contacts[0].email"] ||
          emailPaths["tx.custom_data.email"] ||
          emailPaths["tx.billing_details.email"] ||
          "";

        console.log("[Paddle] transaction.completed EXTRACTED:", {
          subscription_id: subId,
          email_found:     email || "(none)",
          email_paths_tried: emailPaths,
          customer_id:     tx?.customer_id,
        });

        if (!subId) {
          console.warn("[Paddle] transaction.completed — no subscription_id, skipping");
          break;
        }
        if (!email) {
          console.warn("[Paddle] transaction.completed — no email found in any path, skipping");
          break;
        }

        // Try update first (normal case: subscription row already exists)
        const { data: updateData, error: updateError } = await supabase
          .from("subscriptions")
          .update({ customer_email: email })
          .eq("subscription_id", subId)
          .select();

        console.log("[Paddle] transaction.completed UPDATE RESULT:", {
          rows_updated: updateData?.length ?? 0,
          error: updateError,
        });

        if (updateError) {
          console.error("[Paddle] transaction.completed update error:", updateError.message);
        } else if ((updateData?.length ?? 0) === 0) {
          // Race condition: subscription row doesn't exist yet — upsert a partial row
          // subscription.activated will fill plan/status/access_until later
          console.warn("[Paddle] transaction.completed — 0 rows updated, subscription row not yet created. Upserting partial row with email.");
          const { data: upsertData, error: upsertError } = await supabase
            .from("subscriptions")
            .upsert(
              { subscription_id: subId, customer_email: email },
              { onConflict: "subscription_id" }
            )
            .select();
          console.log("[Paddle] transaction.completed PARTIAL UPSERT:", { data: upsertData, error: upsertError });
          if (upsertError) console.error("[Paddle] transaction.completed partial upsert error:", upsertError.message);
        } else {
          console.log(`[Paddle] transaction.completed OK — email=${email} saved for subId=${subId}`);
        }
        break;
      }

      default:
        console.log(`[Paddle Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err: any) {
    console.error("[Paddle Webhook] Unexpected error");
    console.error("  name   :", err?.name);
    console.error("  message:", err?.message);
    console.error("  cause  :", err?.cause);
    console.error("  stack  :", err?.stack);
    // Still return 200 so Paddle does not keep retrying
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
