import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── GET /api/business-profile — foto global del panel ────────────────────────
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("business_profile")
      .select("owner_name, owner_photo_url")
      .eq("id", 1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? { owner_name: null, owner_photo_url: null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

// ── PATCH /api/business-profile — actualizar nombre o URL de foto ─────────────
export async function PATCH(req: NextRequest) {
  try {
    const { owner_name, owner_photo_url } = await req.json();
    const supabase = getSupabase();
    const { error } = await supabase
      .from("business_profile")
      .update({ owner_name, owner_photo_url, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

// ── POST /api/business-profile — subir nueva foto global ─────────────────────
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Máx. 5 MB" }, { status: 400 });
    }

    const ext    = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path   = `global/owner-photo.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabase();

    const { error: uploadErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

    const { data: { publicUrl } } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(path);

    const photoUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from("business_profile")
      .update({ owner_photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, owner_photo_url: photoUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
