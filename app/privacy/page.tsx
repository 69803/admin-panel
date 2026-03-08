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
        <a href="/pricing" style={s.back}>← Back to Pricing</a>
        <h1 style={s.h1}>Privacy Policy</h1>
        <div style={s.date}>Last updated: March 2026</div>

        <h2 style={s.h2}>1. Data Controller</h2>
        <p style={s.p}>The data controller is Kristian Barrios, reachable at kristianbarrios8@gmail.com. We are committed to protecting your personal data and processing it in accordance with applicable data protection law, including the EU General Data Protection Regulation (GDPR).</p>

        <h2 style={s.h2}>2. Data We Collect</h2>
        <p style={s.p}>We collect the following personal data when you use our Service:</p>
        <p style={s.p}>— <strong>Account data:</strong> name, email address.<br />
        — <strong>Payment data:</strong> payments are processed by Paddle (paddle.com). We do not store card numbers or sensitive payment details. Paddle acts as our Merchant of Record and handles all payment processing.<br />
        — <strong>Usage data:</strong> log-ins, actions performed within the panel, browser type, and IP address for security purposes.</p>

        <h2 style={s.h2}>3. Purpose of Processing</h2>
        <p style={s.p}>We use your data exclusively to: provide and manage access to the Service, process and verify subscription payments via Paddle, send transactional communications (activation, invoices, support), improve service performance and security, and comply with legal obligations.</p>

        <h2 style={s.h2}>4. Legal Basis</h2>
        <p style={s.p}>Processing is based on: the performance of a contract (your subscription), our legitimate interests in operating and securing the Service, and compliance with legal obligations.</p>

        <h2 style={s.h2}>5. Data Retention</h2>
        <p style={s.p}>We retain your data for as long as your subscription is active and for up to 3 years after cancellation, unless a longer retention period is required by law.</p>

        <h2 style={s.h2}>6. Third-Party Processors</h2>
        <p style={s.p}>We share data with the following third-party processors under appropriate data protection agreements:</p>
        <p style={s.p}>— <strong>Paddle (paddle.com):</strong> payment processing and subscription management. Paddle is our Merchant of Record.<br />
        — <strong>Vercel (vercel.com):</strong> application hosting and infrastructure.<br />
        — <strong>Render (render.com):</strong> backend API hosting.</p>
        <p style={s.p}>We do not sell your personal data to any third party.</p>

        <h2 style={s.h2}>7. International Transfers</h2>
        <p style={s.p}>Some of our processors are based outside the EU/EEA. In such cases, transfers are covered by Standard Contractual Clauses or equivalent safeguards as approved by the European Commission.</p>

        <h2 style={s.h2}>8. Security</h2>
        <p style={s.p}>We apply appropriate technical and organisational measures to protect your data, including HTTPS/TLS encryption, access controls, and secure authentication. No method of transmission over the internet is 100% secure; we strive to use commercially acceptable means to protect your data.</p>

        <h2 style={s.h2}>9. Your Rights</h2>
        <p style={s.p}>Under GDPR you have the right to: access your data, correct inaccurate data, request deletion, restrict or object to processing, and data portability. To exercise any of these rights, email kristianbarrios8@gmail.com with your request and proof of identity.</p>

        <h2 style={s.h2}>10. Cookies</h2>
        <p style={s.p}>We use localStorage solely to maintain your authenticated session. We do not use tracking cookies or advertising cookies.</p>

        <h2 style={s.h2}>11. Changes to This Policy</h2>
        <p style={s.p}>We may update this policy from time to time. Significant changes will be communicated by email. Continued use of the Service after the effective date constitutes acceptance of the revised policy.</p>

        <h2 style={s.h2}>12. Contact</h2>
        <p style={s.p}>For privacy-related enquiries or to exercise your rights, contact us at: kristianbarrios8@gmail.com</p>
      </div>
    </main>
  );
}
