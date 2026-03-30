import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const DEV_KEY = "devpanel2026";
const OWNER_EMAIL = "kristianbarrios8@gmail.com";

// Fallback whitelist — used when the clients table doesn't exist yet in Supabase
// Once the table is created and emails are inserted there, this list still works as a safety net
const FALLBACK_ALLOWED = [
  "kristianbarrios8@gmail.com",
  "gusmeliab@gmail.com",
  "compipana2@gmail.com",
];

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// GET /api/clients?key=devpanel2026          → list all clients
// GET /api/clients?email=xxx                 → check if email is allowed (no key needed)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const email = searchParams.get("email");
  const key = searchParams.get("key");

  // ── Check single email (used by login page) ──────────────────────
  if (email) {
    const normalized = email.toLowerCase().trim();

    // Fallback list always wins — works even if Supabase table doesn't exist yet
    if (FALLBACK_ALLOWED.includes(normalized)) {
      return NextResponse.json({ allowed: true, reason: "fallback" });
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("clients")
        .select("email")
        .eq("email", normalized)
        .maybeSingle();
      if (error) {
        console.error("[clients] DB error:", error.message);
        return NextResponse.json({ allowed: false, reason: "db_error" });
      }
      return NextResponse.json({ allowed: data !== null });
    } catch (err: any) {
      console.error("[clients] Unexpected error:", err?.message);
      return NextResponse.json({ allowed: false, reason: "error" });
    }
  }

  // ── List all clients (requires dev key) ──────────────────────────
  if (key !== DEV_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("clients")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// POST /api/clients  { email, key }  → create a new client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, key } = body;

    if (key !== DEV_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("clients")
      .insert({ email: normalized })
      .select()
      .single();

    if (error) {
      // Unique constraint violation = email already exists
      if (error.code === "23505") {
        return NextResponse.json({ error: "Este email ya existe" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[clients] Created client: ${normalized}`);
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE /api/clients  { email, key }  → remove a client
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, key } = body;

    if (key !== DEV_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("email", email.toLowerCase().trim());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
