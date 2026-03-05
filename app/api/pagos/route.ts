import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// En dev usa la raiz del proyecto, en produccion (Vercel) usa /tmp
const FILE =
  process.env.NODE_ENV === "production"
    ? "/tmp/pagos.json"
    : path.join(process.cwd(), "pagos.json");

const DEV_KEY = "devpanel2026";

function readPagos(): any[] {
  try {
    if (fs.existsSync(FILE)) {
      return JSON.parse(fs.readFileSync(FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function savePagos(pagos: any[]) {
  fs.writeFileSync(FILE, JSON.stringify(pagos, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pagos = readPagos();
    pagos.push({
      id: Date.now(),
      ...body,
      recibido: new Date().toISOString(),
      estado: "pendiente",
    });
    savePagos(pagos);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== DEV_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(readPagos());
}

export async function PATCH(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (key !== DEV_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id, estado } = await req.json();
  const pagos = readPagos();
  const idx = pagos.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  pagos[idx].estado = estado;
  savePagos(pagos);

  // Enviar email si se verifica el pago
  if (estado === "verificado" && pagos[idx].email) {
    const pago = pagos[idx];
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: pago.email,
          subject: `✅ Tu pago del Plan ${pago.plan} ha sido verificado`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b1220;color:#fff;border-radius:16px;">
              <h1 style="font-size:28px;font-weight:900;margin:0 0 8px;">✅ Pago verificado</h1>
              <p style="opacity:.65;margin:0 0 24px;">Tu acceso al panel ha sido activado.</p>

              <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="margin-bottom:10px;"><span style="opacity:.5;font-size:12px;">PLAN</span><br/><strong style="font-size:18px;">${pago.plan}</strong></div>
                <div style="margin-bottom:10px;"><span style="opacity:.5;font-size:12px;">IMPORTE</span><br/><strong>${pago.precio}</strong></div>
                <div><span style="opacity:.5;font-size:12px;">REFERENCIA</span><br/><strong style="font-family:monospace;">${pago.referencia}</strong></div>
              </div>

              <p style="opacity:.6;font-size:14px;line-height:1.7;">
                Gracias por confiar en nosotros. Si tienes cualquier duda, responde a este correo y te ayudamos.
              </p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error("Error enviando email:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
