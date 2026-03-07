export default function RefundPage() {
  const s = {
    main: { minHeight: "100vh", background: "#0b1220", color: "#fff", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: "60px 24px 80px" } as React.CSSProperties,
    wrap: { maxWidth: 720, margin: "0 auto" } as React.CSSProperties,
    h1: { fontSize: 32, fontWeight: 1000, marginBottom: 8 } as React.CSSProperties,
    date: { opacity: 0.45, fontSize: 13, marginBottom: 40 } as React.CSSProperties,
    h2: { fontSize: 18, fontWeight: 900, marginTop: 36, marginBottom: 10, color: "#c4b5fd" } as React.CSSProperties,
    p: { opacity: 0.7, fontSize: 14, lineHeight: 1.8, marginBottom: 12 } as React.CSSProperties,
    back: { display: "inline-block", marginBottom: 32, color: "#a78bfa", fontSize: 14, textDecoration: "none", opacity: 0.8 } as React.CSSProperties,
    highlight: { background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", borderRadius: 12, padding: "18px 20px", marginBottom: 24 } as React.CSSProperties,
    highlightText: { fontSize: 15, fontWeight: 800, color: "#c4b5fd" } as React.CSSProperties,
  };

  return (
    <main style={s.main}>
      <div style={s.wrap}>
        <a href="/pricing" style={s.back}>← Volver a Precios</a>
        <h1 style={s.h1}>Política de Reembolso</h1>
        <div style={s.date}>Última actualización: marzo 2026</div>

        <div style={s.highlight}>
          <div style={s.highlightText}>Garantía de devolución de 30 dias</div>
          <p style={{ ...s.p, marginBottom: 0, marginTop: 6 }}>Si no estás satisfecho en los primeros 30 dias desde la activación de tu plan, te devolvemos el importe completo sin preguntas.</p>
        </div>

        <h2 style={s.h2}>1. Derecho de reembolso</h2>
        <p style={s.p}>El cliente tiene derecho a solicitar el reembolso completo del importe abonado dentro de los primeros 30 dias naturales desde la fecha de activación de su plan, sin necesidad de justificación.</p>

        <h2 style={s.h2}>2. Cómo solicitar un reembolso</h2>
        <p style={s.p}>Para solicitar el reembolso, envía un correo a kristianbarrios8@gmail.com con el asunto "Solicitud de reembolso" e indica: tu nombre o email de acceso, el plan contratado, la fecha de pago y el número de referencia de la transferencia.</p>
        <p style={s.p}>Procesamos todas las solicitudes en un plazo máximo de 5 dias hábiles.</p>

        <h2 style={s.h2}>3. Método de devolución</h2>
        <p style={s.p}>El reembolso se realiza mediante transferencia bancaria a la misma cuenta desde la que se realizó el pago original. Si eso no fuera posible, acordaremos otro método contigo directamente.</p>

        <h2 style={s.h2}>4. Excepciones</h2>
        <p style={s.p}>No se aplica la garantía de reembolso en los siguientes casos:</p>
        <p style={s.p}>— Solicitudes realizadas transcurridos más de 30 dias desde la activación.<br />— Cuentas suspendidas por incumplimiento de los Términos de Servicio (uso fraudulento, abuso del sistema, etc.).<br />— Planes con descuento especial o promocional acordados individualmente, salvo pacto expreso en contrario.</p>

        <h2 style={s.h2}>5. Cancelaciones sin reembolso</h2>
        <p style={s.p}>Las cancelaciones realizadas después del periodo de 30 dias no dan derecho a reembolso proporcional del tiempo restante del periodo contratado. El acceso seguirá activo hasta el final del periodo pagado.</p>

        <h2 style={s.h2}>6. Contacto</h2>
        <p style={s.p}>Para cualquier consulta sobre esta política o para tramitar un reembolso, contacta con nosotros en kristianbarrios8@gmail.com. Respondemos en menos de 24 horas en dias laborables.</p>
      </div>
    </main>
  );
}
