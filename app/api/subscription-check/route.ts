import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ENFORCE_DATE = new Date("2026-04-01T00:00:00");
const OWNER_EMAIL = "kristianbarrios8@gmail.com";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  // Before enforcement date: always allow (no DB query needed)
  if (new Date() < ENFORCE_DATE) {
    return NextResponse.json({ allowed: true, reason: "pre_enforce" });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ allowed: false, reason: "no_email" });
  }

  // Owner bypass — always allow regardless of subscription
  if (email.toLowerCase().trim() === OWNER_EMAIL) {
    return NextResponse.json({ allowed: true, reason: "owner" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("customer_email", email.toLowerCase().trim())
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[subscription-check] DB error:", error.message);
      return NextResponse.json({ allowed: false, reason: "db_error" });
    }

    const allowed = data !== null;
    console.log(`[subscription-check] email=${email} allowed=${allowed}`);
    return NextResponse.json({ allowed });
  } catch (err: any) {
    console.error("[subscription-check] Unexpected error:", err?.message ?? err);
    return NextResponse.json({ allowed: false, reason: "error" });
  }
}
