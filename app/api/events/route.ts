import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const DEV_KEY = "devpanel2026";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── POST /api/events — insertar un evento de tracking ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, session_id, event_type, route, module, event_name, metadata, duration_ms } = body;

    if (!email || !event_type || !route) {
      return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("page_events").insert({
      email:       email.toLowerCase().trim(),
      session_id:  session_id ?? "unknown",
      event_type,
      route,
      module:      module ?? route,
      event_name:  event_name ?? null,
      metadata:    metadata ?? {},
      duration_ms: duration_ms ?? null,
    });

    if (error) {
      console.error("[events] insert error:", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[events] POST error:", err?.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// ── GET /api/events?email=X&date=YYYY-MM-DD&key=K — detalle de un día ────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const key   = searchParams.get("key");
  const email = searchParams.get("email");
  const date  = searchParams.get("date"); // YYYY-MM-DD

  if (key !== DEV_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!email || !date) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Buscar eventos del día completo (UTC). Se da margen de ±1 día para cubrir
    // diferencias de zona horaria del cliente.
    const from = `${date}T00:00:00.000Z`;
    const to   = `${date}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("page_events")
      .select("id, session_id, event_type, route, module, event_name, metadata, duration_ms, ts")
      .eq("email", email.toLowerCase().trim())
      .gte("ts", from)
      .lte("ts", to)
      .order("ts", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const events = data ?? [];

    // ── Resumen del día ────────────────────────────────────────────────────
    const pageEnters = events.filter((e) => e.event_type === "page_enter");
    const pageExits  = events.filter((e) => e.event_type === "page_exit");

    const totalActiveMs = pageExits.reduce((acc, e) => acc + (e.duration_ms ?? 0), 0);
    const pagesVisited  = [...new Set(pageEnters.map((e) => e.module ?? e.route))];
    const navFlow       = pageEnters.map((e) => e.module ?? e.route);

    return NextResponse.json({
      events,
      summary: {
        first_activity:  events[0]?.ts ?? null,
        last_activity:   events[events.length - 1]?.ts ?? null,
        total_active_ms: totalActiveMs,
        pages_visited:   pagesVisited,
        total_events:    events.length,
        navigation_flow: navFlow,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
