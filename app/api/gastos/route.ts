import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// GET /api/gastos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&categoria=X&limit=200
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const categoria = searchParams.get("categoria");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "200")), 2000);

    const supabase = getSupabase();
    let query = supabase
      .from("gasto")
      .select("id, fecha, concepto, monto, categoria, created_at")
      .order("fecha", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (desde) query = query.gte("fecha", desde);
    if (hasta) query = query.lte("fecha", hasta);
    if (categoria) query = query.ilike("categoria", categoria.trim());

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// POST /api/gastos  { fecha, concepto, monto, categoria }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fecha, concepto, monto, categoria } = body;

    if (!concepto?.trim()) {
      return NextResponse.json({ error: "concepto requerido" }, { status: 400 });
    }
    const montoNum = parseFloat(monto ?? 0);
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      return NextResponse.json({ error: "monto inválido" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("gasto")
      .insert({
        fecha: fecha ?? null,
        concepto: concepto.trim(),
        monto: montoNum,
        categoria: (categoria ?? "OTROS").trim(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
