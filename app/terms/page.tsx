export default function TermsPage() {
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
        <h1 style={s.h1}>Términos de Servicio</h1>
        <div style={s.date}>Última actualización: marzo 2026</div>

        <h2 style={s.h2}>1. Objeto</h2>
        <p style={s.p}>Estos Términos regulan el acceso y uso del panel web de gestión para restaurantes (en adelante, "el Servicio") desarrollado y ofrecido por Kristian Barrios ("el Desarrollador"). Al realizar el pago y acceder al Servicio, el cliente acepta estos Términos en su totalidad.</p>

        <h2 style={s.h2}>2. Descripción del servicio</h2>
        <p style={s.p}>El Servicio consiste en un panel web accesible desde navegador que permite gestionar menús, pedidos, cocina (KDS), contabilidad y reportes de un establecimiento de restauración. El acceso se activa manualmente por el Desarrollador tras verificar el pago.</p>

        <h2 style={s.h2}>3. Registro y acceso</h2>
        <p style={s.p}>El acceso al panel se proporciona mediante credenciales personales (email y contraseña). El cliente es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas bajo su cuenta.</p>

        <h2 style={s.h2}>4. Pagos y facturación</h2>
        <p style={s.p}>El pago se realiza mediante transferencia bancaria por adelantado, con periodicidad mensual o anual según el plan contratado. El acceso se activa en un plazo máximo de 24 horas tras la verificación del pago. El Desarrollador se reserva el derecho de suspender el acceso en caso de impago.</p>

        <h2 style={s.h2}>5. Periodo de prueba</h2>
        <p style={s.p}>Se ofrece un periodo de prueba de 14 días sin coste en cualquier plan. No se requiere tarjeta de crédito para el periodo de prueba.</p>

        <h2 style={s.h2}>6. Cancelación</h2>
        <p style={s.p}>El cliente puede cancelar su suscripción en cualquier momento sin penalización. La cancelación será efectiva al final del periodo de facturación en curso. No se realizan reembolsos parciales de periodos no consumidos, salvo lo dispuesto en la Política de Reembolso.</p>

        <h2 style={s.h2}>7. Disponibilidad del servicio</h2>
        <p style={s.p}>El Desarrollador se compromete a mantener el Servicio disponible con una disponibilidad objetiva del 99,9%. Las interrupciones programadas por mantenimiento serán notificadas con antelación siempre que sea posible.</p>

        <h2 style={s.h2}>8. Limitación de responsabilidad</h2>
        <p style={s.p}>El Desarrollador no será responsable de pérdidas de datos, lucro cesante o daños indirectos derivados del uso o imposibilidad de uso del Servicio. La responsabilidad máxima del Desarrollador se limita al importe abonado en los últimos 30 días.</p>

        <h2 style={s.h2}>9. Propiedad intelectual</h2>
        <p style={s.p}>El Servicio, su código, diseño y contenidos son propiedad exclusiva del Desarrollador. El cliente recibe una licencia de uso limitada, no exclusiva e intransferible durante la vigencia de su suscripción.</p>

        <h2 style={s.h2}>10. Modificaciones</h2>
        <p style={s.p}>El Desarrollador puede modificar estos Términos notificando al cliente con al menos 15 días de antelación. El uso continuado del Servicio tras esa fecha implica la aceptación de los nuevos Términos.</p>

        <h2 style={s.h2}>11. Ley aplicable</h2>
        <p style={s.p}>Estos Términos se rigen por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales del domicilio del Desarrollador.</p>
      </div>
    </main>
  );
}
