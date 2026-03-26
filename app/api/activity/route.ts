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

// POST — registrar visita
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Sin email" }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase
      .from("user_activity")
      .insert({ email, visited_at: new Date().toISOString() });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

// GET — obtener actividad agrupada por usuario (protegido)
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== DEV_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("user_activity")
      .select("email, visited_at")
      .order("visited_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Agrupar por email
    const map: Record<string, { email: string; lastSeen: string; visits: string[] }> = {};
    for (const row of data ?? []) {
      if (!map[row.email]) {
        map[row.email] = { email: row.email, lastSeen: row.visited_at, visits: [] };
      }
      map[row.email].visits.push(row.visited_at);
    }

    const result = Object.values(map).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
