import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// PUT /api/contabilidad/movimientos/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const update: Record<string, any> = {};

    if (body.fecha !== undefined) update.fecha = body.fecha;
    if (body.concepto !== undefined) update.concepto = String(body.concepto).trim();
    if (body.categoria !== undefined) update.categoria = String(body.categoria).trim();
    if (body.tipo !== undefined) update.tipo = String(body.tipo).toUpperCase().trim();
    if (body.proveedor !== undefined) update.proveedor = body.proveedor;
    if (body.factura_no !== undefined) update.factura_no = body.factura_no;
    if (body.productos_servicios !== undefined) update.productos_servicios = body.productos_servicios;
    if (body.modo_pago !== undefined) update.modo_pago = body.modo_pago;
    if (body.observacion !== undefined) update.observacion = body.observacion;

    if (body.monto !== undefined || body.iva !== undefined) {
      const monto = parseFloat(body.monto ?? 0);
      const iva = parseFloat(body.iva ?? 0);
      update.monto = monto;
      update.iva = iva;
      update.neto = Math.max(0, monto - iva);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("movimientos_contables")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE /api/contabilidad/movimientos/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("movimientos_contables").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
