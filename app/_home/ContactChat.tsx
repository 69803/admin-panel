"use client";

import { Fragment, useState } from "react";

// Chat de contacto de la portada: se envía con EmailJS (desde tu Gmail).
// "Contact Us" te llega a ti (Responder = al visitante) y "Auto-Reply" le
// manda al visitante el "Gracias por contactar". Estas claves son públicas.
const EMAILJS = {
  service: "service_suv2xss",
  toOwner: "template_uqy0ssh",
  autoReply: "template_jozbphz",
  publicKey: "rgshWAUMSGK-gwj3u",
};

async function sendEmail(template: string, params: Record<string, string>) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS.service,
      template_id: template,
      user_id: EMAILJS.publicKey,
      template_params: params,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}
type Sent = { text: string };

export default function ContactChat() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // trampa para bots
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent[]>([]);
  const [error, setError] = useState("");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSend = message.trim().length >= 2 && emailOk && !sending;

  async function send(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError("");
    const text = message.trim();
    try {
      if (website) throw new Error(); // bot
      const params = {
        name: name.trim() || "Visitor",
        email: email.trim(),
        message: text,
        title: "New message from krisonroad.com",
        time: new Date().toLocaleString("en-GB"),
      };
      await sendEmail(EMAILJS.toOwner, params);
      await sendEmail(EMAILJS.autoReply, params).catch(() => {});
      setSent((s) => [...s, { text }]);
      setMessage("");
    } catch {
      setError("Could not send your message. Please try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat">
      <div className="bubble them">
        <small>Krisonroad</small>
        Hi! 👋 Tell us your suggestion, idea or problem, and leave your email so we can reply.
      </div>

      {sent.map((m, i) => (
        <Fragment key={i}>
          <div className="bubble mine">{m.text}</div>
          <div className="bubble them">
            <small>Krisonroad</small>
            Got it, thank you! We sent a confirmation to your email and will reply soon.
          </div>
        </Fragment>
      ))}

      {sending && (
        <div className="bubble them" aria-live="polite">
          <span className="typing" aria-label="Sending">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}

      <form className="composer" onSubmit={send}>
        <div className="row">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            aria-label="Your name"
          />
          <input
            type="email"
            placeholder="Your email *"
            required
            value={email}
            maxLength={200}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Your email"
          />
        </div>
        <textarea
          placeholder="Write your message…"
          value={message}
          maxLength={4000}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e);
          }}
          aria-label="Your message"
          required
        />
        <label className="hp" aria-hidden="true">
          Leave empty
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        {error && <p className="err">{error}</p>}
        <div className="send">
          <span className="hint">Ctrl + Enter to send</span>
          <button type="submit" disabled={!canSend}>
            {sending ? "Sending…" : "Send ➤"}
          </button>
        </div>
      </form>
    </div>
  );
}
