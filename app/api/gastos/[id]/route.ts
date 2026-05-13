import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// PUT /api/gastos/[id]  { fecha?, concepto?, monto?, categoria? }
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
    if (body.monto !== undefined) update.monto = parseFloat(body.monto);
    if (body.categoria !== undefined) update.categoria = String(body.categoria).trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("gasto")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE /api/gastos/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("gasto").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
