import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── GET /api/profile?email=X — leer perfil ────────────────────────────────────
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Sin email" }, { status: 400 });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("email, nombre, apellido, photo_url")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? { email, nombre: "", apellido: "", photo_url: null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

// ── PATCH /api/profile — guardar nombre y apellido ────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { email, nombre, apellido } = await req.json();
    if (!email) return NextResponse.json({ error: "Sin email" }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase.from("profiles").upsert({
      email: email.toLowerCase().trim(),
      nombre:   nombre   ?? "",
      apellido: apellido ?? "",
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

// ── POST /api/profile — subir foto a Supabase Storage ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const form  = await req.formData();
    const email = (form.get("email") as string | null)?.toLowerCase().trim();
    const file  = form.get("file") as File | null;

    if (!email) return NextResponse.json({ error: "Sin email" }, { status: 400 });
    if (!file)  return NextResponse.json({ error: "Sin archivo" }, { status: 400 });

    // Validar tipo y tamaño (máx. 5 MB)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no puede superar 5 MB" }, { status: 400 });
    }

    const ext        = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const storagePath = `${email}/photo.${ext}`;
    const buffer     = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabase();

    // Subir al bucket público "profile-photos"
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true, // sobreescribe si ya existe
      });

    if (uploadError) {
      console.error("[profile] upload error:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(storagePath);

    // Añadir cache-buster para forzar recarga después de resubir
    const photoUrl = `${publicUrl}?t=${Date.now()}`;

    // Guardar URL en la tabla profiles
    const { error: dbError } = await supabase.from("profiles").upsert({
      email,
      photo_url:  photoUrl,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (dbError) {
      console.error("[profile] db error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, photo_url: photoUrl });
  } catch (e: any) {
    console.error("[profile] POST error:", e?.message);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

// ── DELETE /api/profile?email=X — quitar foto ─────────────────────────────────
export async function DELETE(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Sin email" }, { status: 400 });

  try {
    const supabase = getSupabase();

    // Intentar borrar archivos del storage (jpg y png por si acaso)
    await supabase.storage.from("profile-photos").remove([
      `${email}/photo.jpg`,
      `${email}/photo.png`,
      `${email}/photo.gif`,
      `${email}/photo.webp`,
    ]);

    // Limpiar URL en la tabla
    const { error } = await supabase.from("profiles").upsert({
      email,
      photo_url:  null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
