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
        <a href="/pricing" style={s.back}>← Back to Pricing</a>
        <h1 style={s.h1}>Terms of Service</h1>
        <div style={s.date}>Last updated: March 2026</div>

        <h2 style={s.h2}>1. Agreement</h2>
        <p style={s.p}>These Terms of Service ("Terms") govern your access to and use of the restaurant management panel web application (the "Service") developed and operated by Kristian Barrios ("we", "us", or "our"). By subscribing to or using the Service, you agree to be bound by these Terms.</p>

        <h2 style={s.h2}>2. Description of Service</h2>
        <p style={s.p}>The Service is a browser-based web application that enables restaurant operators to manage menus, real-time orders, kitchen display systems (KDS), daily accounting, and reports. Access is provided per subscription plan as described on our pricing page.</p>

        <h2 style={s.h2}>3. Account Registration</h2>
        <p style={s.p}>You must provide a valid email address to access the Service. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at kristianbarrios8@gmail.com if you suspect unauthorised access.</p>

        <h2 style={s.h2}>4. Payments and Billing</h2>
        <p style={s.p}>Subscriptions are billed on a monthly or annual basis depending on the plan selected. Payments are processed securely by Paddle (paddle.com), our authorised reseller and Merchant of Record. By completing a purchase you agree to Paddle's terms and privacy policy in addition to ours.</p>
        <p style={s.p}>Subscription fees are charged at the start of each billing cycle. Failure to pay may result in suspension or termination of access.</p>

        <h2 style={s.h2}>5. Free Trial</h2>
        <p style={s.p}>We offer a 14-day free trial on all plans. No payment information is required during the trial period. At the end of the trial, continued access requires an active paid subscription.</p>

        <h2 style={s.h2}>6. Cancellation</h2>
        <p style={s.p}>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. You will retain full access to the Service until that date. No partial refunds are issued for unused time, except as described in our Refund Policy.</p>

        <h2 style={s.h2}>7. Refunds</h2>
        <p style={s.p}>We offer a 30-day money-back guarantee. Please refer to our <a href="/refunds" style={{ color: "#a78bfa" }}>Refund Policy</a> for full details.</p>

        <h2 style={s.h2}>8. Acceptable Use</h2>
        <p style={s.p}>You agree not to misuse the Service. Prohibited activities include, but are not limited to: attempting to gain unauthorised access to other accounts or systems, distributing malware, scraping the platform, reselling access without authorisation, or using the Service for any unlawful purpose.</p>

        <h2 style={s.h2}>9. Service Availability</h2>
        <p style={s.p}>We aim to maintain 99.9% uptime. Scheduled maintenance will be communicated in advance where possible. We are not liable for interruptions beyond our reasonable control.</p>

        <h2 style={s.h2}>10. Limitation of Liability</h2>
        <p style={s.p}>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount you paid in the 30 days preceding the claim.</p>

        <h2 style={s.h2}>11. Intellectual Property</h2>
        <p style={s.p}>All rights, title, and interest in the Service, including its code, design, and content, remain the exclusive property of Kristian Barrios. You are granted a limited, non-exclusive, non-transferable licence to use the Service during your active subscription.</p>

        <h2 style={s.h2}>12. Modifications to Terms</h2>
        <p style={s.p}>We may update these Terms at any time. We will notify you at least 15 days before material changes take effect. Continued use of the Service after that date constitutes acceptance of the updated Terms.</p>

        <h2 style={s.h2}>13. Governing Law</h2>
        <p style={s.p}>These Terms are governed by the laws of Spain. Any disputes shall be subject to the exclusive jurisdiction of the courts of the developer's registered address.</p>

        <h2 style={s.h2}>14. Contact</h2>
        <p style={s.p}>For questions about these Terms, contact us at: kristianbarrios8@gmail.com</p>
      </div>
    </main>
  );
}
