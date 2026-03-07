export default function PrivacyPage() {
  const s = {
    main: { minHeight: "100vh", background: "#0b1220", color: "#fff", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: "60px 24px 80px" } as React.CSSProperties,
    wrap: { maxWidth: 720, margin: "0 auto" } as React.CSSProperties,
    h1: { fontSize: 32, fontWeight: 1000, marginBottom: 8 } as React.CSSProperties,
    date: { opacity: 0.45, fontSize: 13, marginBottom: 40 } as React.CSSProperties,
    h2: { fontSize: 18, fontWeight: 900, marginTop: 36, marginBottom: 10, color: "#c4b5fd" } as React.CSSProperties,
    p: { opacity: 0.7, fontSize: 14, lineHeight: 1.8, marginBottom: 12 } as React.CSSProperties,
    back: { display: "inline-block", marginBottom: 32, color: "#a78bfa", fontSize: 14, textDecoration: "none", opacity: 0.8 } as React.CSSProperties,
  };

  return (
    <main style={s.main}>
      <div style={s.wrap}>
        <a href="/pricing" style={s.back}>← Volver a Precios</a>
        <h1 style={s.h1}>Política de Privacidad</h1>
        <div style={s.date}>Última actualización: marzo 2026</div>

        <h2 style={s.h2}>1. Responsable del tratamiento</h2>
        <p style={s.p}>El responsable del tratamiento de datos personales es Kristian Barrios (en adelante, "el Desarrollador"), contactable en kristianbarrios8@gmail.com.</p>

        <h2 style={s.h2}>2. Datos que recopilamos</h2>
        <p style={s.p}>Al contratar nuestros servicios, recopilamos los siguientes datos: nombre o razón social, dirección de correo electrónico, referencia de pago bancario y datos de uso del panel (accesos, acciones realizadas).</p>
        <p style={s.p}>No recopilamos datos de tarjetas de crédito ni información de pago sensible. Los pagos se realizan por transferencia bancaria directa.</p>

        <h2 style={s.h2}>3. Finalidad del tratamiento</h2>
        <p style={s.p}>Los datos recogidos se utilizan exclusivamente para: gestionar el acceso al panel web contratado, verificar pagos y activar suscripciones, enviar comunicaciones relacionadas con el servicio (activación, facturas, soporte), y cumplir con obligaciones legales.</p>

        <h2 style={s.h2}>4. Base legal</h2>
        <p style={s.p}>El tratamiento se basa en la ejecución del contrato de servicio aceptado al realizar el pago, y en el interés legítimo del Desarrollador para el correcto funcionamiento del servicio.</p>

        <h2 style={s.h2}>5. Conservación de los datos</h2>
        <p style={s.p}>Los datos se conservan durante el tiempo en que la suscripción esté activa y hasta 3 años después de su cancelación, salvo obligación legal de conservarlos por más tiempo.</p>

        <h2 style={s.h2}>6. Transferencias a terceros</h2>
        <p style={s.p}>No vendemos ni cedemos datos a terceros. Los datos pueden ser procesados por proveedores de infraestructura (Vercel, servidores de alojamiento) bajo acuerdos de confidencialidad y protección de datos.</p>

        <h2 style={s.h2}>7. Seguridad</h2>
        <p style={s.p}>El panel utiliza conexión cifrada HTTPS (SSL/TLS) en todo momento. El acceso está protegido por credenciales personales. Aplicamos medidas técnicas y organizativas para proteger tus datos frente a accesos no autorizados.</p>

        <h2 style={s.h2}>8. Tus derechos</h2>
        <p style={s.p}>Tienes derecho a acceder, rectificar, suprimir, limitar el tratamiento y portabilidad de tus datos. Para ejercerlos, escribe a kristianbarrios8@gmail.com indicando tu solicitud y datos de identificación.</p>

        <h2 style={s.h2}>9. Cookies</h2>
        <p style={s.p}>El panel utiliza almacenamiento local (localStorage) únicamente para mantener la sesión activa. No utilizamos cookies de rastreo ni publicidad.</p>

        <h2 style={s.h2}>10. Cambios en esta política</h2>
        <p style={s.p}>Nos reservamos el derecho de actualizar esta política. Los cambios significativos serán notificados por correo electrónico.</p>
      </div>
    </main>
  );
}
