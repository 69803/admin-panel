import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Paddle webhook signature verification
// Paddle signs with: HMAC-SHA256(secret, "<ts>:<rawBody>")
// Header format:    Paddle-Signature: ts=<unix>;h1=<hex>
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

  // Reject events older than 5 minutes (replay-attack protection)
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (age > 300) {
    console.warn("[Paddle Webhook] Timestamp too old:", age, "seconds");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== h1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(h1, "hex"));
}

// ---------------------------------------------------------------------------
// POST /api/paddle/webhook
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[Paddle Webhook] PADDLE_WEBHOOK_SECRET env var is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Must read raw body BEFORE any parsing (required for signature verification)
  const rawBody = await req.text();

  const signatureHeader = req.headers.get("Paddle-Signature");
  if (!signatureHeader) {
    console.warn("[Paddle Webhook] Missing Paddle-Signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = verifyPaddleSignature(rawBody, signatureHeader, secret);
  if (!isValid) {
    console.warn("[Paddle Webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse payload only after verification passes
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventType: string = event?.event_type ?? "unknown";
  const eventId: string = event?.notification_id ?? "no-id";

  console.log(`[Paddle Webhook] Received event=${eventType} id=${eventId}`);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  switch (eventType) {

    case "transaction.completed": {
      const tx = event.data;
      console.log(
        `[Paddle] transaction.completed | txId=${tx?.id} | customerId=${tx?.customer_id} | status=${tx?.status} | amount=${tx?.details?.totals?.total}`
      );
      // TODO STEP 3: mark subscription as active in your database
      break;
    }

    case "subscription.created": {
      const sub = event.data;
      console.log(
        `[Paddle] subscription.created | subId=${sub?.id} | customerId=${sub?.customer_id} | status=${sub?.status} | priceId=${sub?.items?.[0]?.price?.id}`
      );
      // TODO STEP 3: create subscription record in your database
      break;
    }

    case "subscription.updated": {
      const sub = event.data;
      console.log(
        `[Paddle] subscription.updated | subId=${sub?.id} | customerId=${sub?.customer_id} | status=${sub?.status}`
      );
      // TODO STEP 3: update subscription record in your database
      break;
    }

    case "subscription.canceled": {
      const sub = event.data;
      console.log(
        `[Paddle] subscription.canceled | subId=${sub?.id} | customerId=${sub?.customer_id} | canceledAt=${sub?.canceled_at}`
      );
      // TODO STEP 3: deactivate subscription in your database
      break;
    }

    default:
      console.log(`[Paddle Webhook] Unhandled event type: ${eventType}`);
  }

  // Paddle requires a 200 response — any other status triggers a retry
  return NextResponse.json({ received: true }, { status: 200 });
}
