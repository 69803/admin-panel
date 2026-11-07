// Recibe los mensajes del chat de la portada y los reenvía por correo con
// FormSubmit (sin claves). El correo de destino solo vive aquí, en el servidor.
// La primera vez FormSubmit manda un correo de "activar formulario" a ese buzón.
const TO = "compipana1@gmail.com";

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Trampa para bots: un humano nunca llena este campo.
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const message = clean(body.message, 4000);

  if (message.length < 2) return Response.json({ ok: false }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const res = await fetch(`https://formsubmit.co/ajax/${TO}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://krisonroad.com",
      Referer: "https://krisonroad.com/",
    },
    body: JSON.stringify({
      _subject: "Nuevo mensaje desde krisonroad.com",
      _template: "table",
      _captcha: "false",
      ...(email ? { _replyto: email } : {}),
      Nombre: name || "(sin nombre)",
      Correo: email || "(sin correo)",
      Mensaje: message,
    }),
  }).catch(() => null);

  const data = res ? await res.json().catch(() => null) : null;
  const success = res?.ok && (data?.success === true || data?.success === "true");
  if (!success) {
    console.error("contacto: FormSubmit no aceptó el mensaje", res?.status, data);
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true });
}
