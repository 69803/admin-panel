"use client";

import { useState } from "react";

// Chat de contacto de la portada: lo que escribe el visitante se manda a
// /api/contacto, que lo reenvía por correo. El correo de destino no aparece
// en la página.
type Sent = { text: string };

export default function ContactChat() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // trampa para bots
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent[]>([]);
  const [error, setError] = useState("");

  const canSend = message.trim().length >= 2 && !sending;

  async function send(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError("");
    const text = message.trim();
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: text, website }),
      });
      if (!res.ok) throw new Error();
      setSent((s) => [...s, { text }]);
      setMessage("");
    } catch {
      setError("No se pudo enviar. Inténtalo de nuevo en un momento.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat">
      <div className="bubble them">
        <small>Krisonroad</small>
        ¡Hola! 👋 Cuéntanos tu sugerencia, idea o problema. Si quieres respuesta, déjanos tu correo.
      </div>

      {sent.map((m, i) => (
        <div key={i} style={{ display: "contents" }}>
          <div className="bubble me">{m.text}</div>
          <div className="bubble them">
            <small>Krisonroad</small>
            ¡Recibido, gracias! Lo leemos todo{email ? " y te respondemos a tu correo" : ""}.
          </div>
        </div>
      ))}

      {sending && (
        <div className="bubble them" aria-live="polite">
          <span className="typing" aria-label="Enviando">
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
            placeholder="Tu nombre (opcional)"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            aria-label="Tu nombre"
          />
          <input
            type="email"
            placeholder="Tu correo (opcional)"
            value={email}
            maxLength={200}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Tu correo"
          />
        </div>
        <textarea
          placeholder="Escribe tu mensaje…"
          value={message}
          maxLength={4000}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e);
          }}
          aria-label="Tu mensaje"
          required
        />
        <label className="hp" aria-hidden="true">
          No llenar
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        {error && <p className="err">{error}</p>}
        <div className="send">
          <span className="hint">Ctrl + Enter para enviar</span>
          <button type="submit" disabled={!canSend}>
            {sending ? "Enviando…" : "Enviar ➤"}
          </button>
        </div>
      </form>
    </div>
  );
}
