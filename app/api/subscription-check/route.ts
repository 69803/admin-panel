import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const OWNER_EMAIL = "kristianbarrios8@gmail.com";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// Returns today as "YYYY-MM-DD" in UTC, no time component
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
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
      .select("status, access_until")
      .eq("customer_email", email.toLowerCase().trim())
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[subscription-check] DB error:", error.message);
      return NextResponse.json({ allowed: false, reason: "db_error" });
    }

    // No active subscription record → blocked
    if (!data || !data.access_until) {
      console.log(`[subscription-check] email=${email} allowed=false reason=no_record`);
      return NextResponse.json({ allowed: false, reason: "no_record" });
    }

    // Compare dates as strings "YYYY-MM-DD" to avoid timezone issues
    const today = todayUTC();
    const allowed = today <= data.access_until;

    console.log(`[subscription-check] email=${email} today=${today} access_until=${data.access_until} allowed=${allowed}`);
    return NextResponse.json({ allowed });
  } catch (err: any) {
    console.error("[subscription-check] Unexpected error:", err?.message ?? err);
    return NextResponse.json({ allowed: false, reason: "error" });
  }
}
