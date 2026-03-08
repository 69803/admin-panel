export default function RefundsPage() {
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
        <a href="/pricing" style={s.back}>← Back to Pricing</a>
        <h1 style={s.h1}>Refund Policy</h1>
        <div style={s.date}>Last updated: March 2026</div>

        <div style={s.highlight}>
          <div style={s.highlightText}>30-Day Money-Back Guarantee</div>
          <p style={{ ...s.p, marginBottom: 0, marginTop: 6 }}>If you are not satisfied within the first 30 days of your subscription, we will refund you in full — no questions asked.</p>
        </div>

        <h2 style={s.h2}>1. Eligibility</h2>
        <p style={s.p}>You are entitled to a full refund if you request it within 30 calendar days from the date your subscription was activated. This applies to all plans (Basic, Pro, and Premium) on both monthly and annual billing cycles.</p>

        <h2 style={s.h2}>2. How to Request a Refund</h2>
        <p style={s.p}>To request a refund, send an email to kristianbarrios8@gmail.com with the subject line "Refund Request" and include the following information:</p>
        <p style={s.p}>— The email address associated with your account.<br />
        — The plan you subscribed to.<br />
        — The date of purchase.<br />
        — Your Paddle order ID (found in your payment confirmation email).</p>
        <p style={s.p}>We process all refund requests within 5 business days of receipt.</p>

        <h2 style={s.h2}>3. Refund Method</h2>
        <p style={s.p}>Refunds are issued to the original payment method used at checkout, processed through Paddle. Depending on your card issuer, it may take 5–10 business days for the amount to appear on your statement.</p>

        <h2 style={s.h2}>4. Exceptions</h2>
        <p style={s.p}>The 30-day money-back guarantee does not apply in the following circumstances:</p>
        <p style={s.p}>— Refund requests submitted more than 30 days after the subscription activation date.<br />
        — Accounts suspended or terminated due to violation of our Terms of Service (e.g. fraud, abuse, or misuse).<br />
        — Subscriptions purchased under a special promotional discount agreed individually, unless expressly stated otherwise.</p>

        <h2 style={s.h2}>5. Cancellations After 30 Days</h2>
        <p style={s.p}>If you cancel your subscription after the 30-day window, no partial refund will be issued for the remaining unused period. Your access will remain active until the end of the current billing cycle.</p>

        <h2 style={s.h2}>6. Subscription Cancellation</h2>
        <p style={s.p}>Requesting a refund also cancels your subscription. Once a refund is processed, access to the Service will be revoked. You may re-subscribe at any time.</p>

        <h2 style={s.h2}>7. Contact</h2>
        <p style={s.p}>For refund requests or questions about this policy, contact us at: kristianbarrios8@gmail.com — we respond within 24 hours on business days.</p>
      </div>
    </main>
  );
}
