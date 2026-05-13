import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// GET /api/contabilidad/movimientos?limit=200
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "200")), 2000);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("movimientos_contables")
      .select("id, fecha, tipo, concepto, categoria, monto, iva, neto, proveedor, factura_no, productos_servicios, modo_pago, observacion, created_at")
      .order("fecha", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// POST /api/contabilidad/movimientos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const tipo = (body.tipo ?? "").toUpperCase().trim();
    if (!["INGRESO", "GASTO"].includes(tipo)) {
      return NextResponse.json({ error: "tipo debe ser INGRESO o GASTO" }, { status: 400 });
    }

    const concepto = (body.concepto ?? "").trim();
    if (!concepto) {
      return NextResponse.json({ error: "concepto requerido" }, { status: 400 });
    }

    const monto = parseFloat(body.monto ?? 0);
    if (!Number.isFinite(monto) || monto < 0) {
      return NextResponse.json({ error: "monto inválido" }, { status: 400 });
    }

    const iva = parseFloat(body.iva ?? 0);
    const neto = Math.max(0, monto - iva);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("movimientos_contables")
      .insert({
        fecha: body.fecha ?? null,
        tipo,
        concepto,
        categoria: (body.categoria ?? "OTROS").trim(),
        monto,
        iva,
        neto,
        proveedor: body.proveedor ?? null,
        factura_no: body.factura_no ?? null,
        productos_servicios: body.productos_servicios ?? null,
        modo_pago: body.modo_pago ?? "Transferencia",
        observacion: body.observacion ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
