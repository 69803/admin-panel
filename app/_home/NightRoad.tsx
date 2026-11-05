"use client";

import { useEffect, useRef } from "react";

// Escena animada de la portada: carretera nocturna en perspectiva, sol de
// neón con franjas, montañas, estrellas y luces de carros que vienen y van.
// Sigue el puntero y se pausa cuando no está a la vista.
export default function NightRoad() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let tx = 0; // posición suavizada del puntero (-1..1)
    let ty = 0;
    let px = 0; // objetivo del puntero
    let py = 0;

    type Star = { x: number; y: number; r: number; p: number };
    type Car = { x: number; z: number; v: number; away: boolean };
    let stars: Star[] = [];
    let far: number[] = [];
    let near: number[] = [];
    const cars: Car[] = [];

    const ridge = (n: number, rough: number) => {
      const a = Math.random() * 10;
      const b = Math.random() * 10;
      const c = Math.random() * 10;
      return Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        const v =
          0.55 * Math.sin(t * 6.2 + a) +
          0.3 * Math.sin(t * 13.7 + b) +
          rough * Math.sin(t * 31.3 + c);
        return 0.5 + 0.5 * v;
      });
    };

    const spawn = (away: boolean, anywhere: boolean): Car => {
      const lanes = away ? [0.45, 1.05] : [-1.05, -0.45];
      return {
        x: lanes[Math.floor(Math.random() * 2)],
        z: anywhere ? 1 + Math.random() * 38 : away ? 0.6 : 40,
        v: 0.35 + Math.random() * 0.35,
        away,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(420, Math.round((w * h) / 2600));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.62,
        r: Math.random() * 1.25 + 0.25,
        p: Math.random() * Math.PI * 2,
      }));
      far = ridge(90, 0.12);
      near = ridge(60, 0.2);
      if (cars.length === 0) {
        for (let i = 0; i < 7; i++) cars.push(spawn(i % 2 === 0, true));
      }
    };

    const draw = (time: number, dt: number) => {
      tx += (px - tx) * 0.04;
      ty += (py - ty) * 0.04;

      const H = h * 0.64 + ty * 12; // línea del horizonte
      const VX = w / 2 + tx * 50; // punto de fuga
      const f = h - H; // escala de proyección
      const proj = (X: number, z: number) => [VX + (X * f * 0.95) / z, H + f / z] as const;

      // Cielo
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#02030b");
      sky.addColorStop(0.55, "#120a33");
      sky.addColorStop(1, "#45125f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, H + 1);

      // Estrellas
      for (const s of stars) {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.0016 + s.p));
        ctx.globalAlpha = a * Math.min(1, (H - s.y) / (H * 0.35));
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x - tx * 8, s.y - ty * 4, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Sol de neón con franjas que bajan
      const R = Math.min(w, h) * 0.17;
      const cy = H - R * 0.35;
      const halo = ctx.createRadialGradient(VX, cy, R * 0.6, VX, cy, R * 2.2);
      halo.addColorStop(0, "rgba(255,46,136,0.45)");
      halo.addColorStop(1, "rgba(255,46,136,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(VX - R * 2.2, cy - R * 2.2, R * 4.4, H - (cy - R * 2.2));
      ctx.save();
      ctx.beginPath();
      const top = cy - R;
      const stripeStart = cy - R * 0.15;
      ctx.rect(VX - R - 2, top - 2, 2 * R + 4, stripeStart - top + 2);
      const period = R * 0.2;
      const shift = reduce ? 0 : (time * 0.012) % period;
      for (let y = stripeStart - period + shift; y < H; y += period) {
        const k = (y - stripeStart) / (H - stripeStart); // 0 arriba, 1 en el horizonte
        const gap = period * (0.15 + 0.55 * Math.max(0, k));
        const y0 = Math.max(stripeStart, y + gap);
        const y1 = y + period;
        if (y1 > y0) ctx.rect(VX - R - 2, y0, 2 * R + 4, Math.min(y1, H) - y0);
      }
      ctx.clip();
      const sun = ctx.createLinearGradient(0, top, 0, cy + R);
      sun.addColorStop(0, "#ffe27a");
      sun.addColorStop(0.45, "#ff8a3d");
      sun.addColorStop(1, "#ff2e88");
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(VX, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Montañas (dos capas con paralaje)
      const ridgeLayer = (pts: number[], height: number, par: number, fill: string, edge: string) => {
        const span = w * 1.2;
        const x0 = -w * 0.1 - tx * par;
        ctx.beginPath();
        ctx.moveTo(x0, H + 1);
        pts.forEach((v, i) => {
          const x = x0 + (i / (pts.length - 1)) * span;
          const dist = Math.abs(x - VX) / (w * 0.5);
          const valley = Math.min(1, 0.25 + dist * 1.1); // el valle deja ver el sol
          ctx.lineTo(x, H - v * height * valley);
        });
        ctx.lineTo(x0 + span, H + 1);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };
      ridgeLayer(far, h * 0.16, 18, "#1a0f3f", "rgba(160,110,255,0.35)");
      ridgeLayer(near, h * 0.1, 36, "#0b0722", "rgba(255,46,136,0.45)");

      // Suelo
      const ground = ctx.createLinearGradient(0, H, 0, h);
      ground.addColorStop(0, "#14062b");
      ground.addColorStop(1, "#000000");
      ctx.fillStyle = ground;
      ctx.fillRect(0, H, w, h - H);

      const speed = reduce ? 0 : time * 0.0009;
      const phase = speed % 1;

      // Rejilla: líneas horizontales que vienen hacia ti
      ctx.lineWidth = 1;
      for (let i = 1; i < 46; i++) {
        const z = (i - phase) * 0.9;
        if (z < 0.35) continue;
        const y = H + f / z;
        if (y > h + 2) continue;
        ctx.strokeStyle = `rgba(255,46,136,${Math.min(0.85, 1.1 / z)})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Rejilla: líneas hacia el punto de fuga
      for (let X = -24; X <= 24; X += 1.6) {
        const [bx, by] = proj(X, 0.35);
        const g = ctx.createLinearGradient(bx, by, VX, H);
        g.addColorStop(0, "rgba(160,110,255,0.55)");
        g.addColorStop(1, "rgba(160,110,255,0)");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(VX, H);
        ctx.stroke();
      }

      // Carretera
      const [lx, ly] = proj(-1.6, 0.35);
      const [rx] = proj(1.6, 0.35);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(VX, H);
      ctx.lineTo(rx, ly);
      ctx.closePath();
      const asphalt = ctx.createLinearGradient(0, H, 0, h);
      asphalt.addColorStop(0, "rgba(5,3,14,0.6)");
      asphalt.addColorStop(1, "rgba(5,3,14,0.95)");
      ctx.fillStyle = asphalt;
      ctx.fill();
      ctx.save();
      ctx.shadowColor = "#38f3ff";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "#38f3ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(VX, H);
      ctx.lineTo(rx, ly);
      ctx.stroke();
      ctx.restore();

      // Línea central discontinua
      for (let i = 0; i < 40; i++) {
        const z0 = (i - ((speed * 1.6) % 1)) * 1.2;
        const z1 = z0 + 0.55;
        if (z1 < 0.35) continue;
        const [, y0] = proj(0, Math.max(z0, 0.35));
        const [, y1] = proj(0, z1);
        const wide = (f * 0.04) / Math.max(z0, 0.35);
        ctx.fillStyle = `rgba(255,226,122,${Math.min(0.95, 2 / z1)})`;
        ctx.beginPath();
        ctx.moveTo(VX - wide, y0);
        ctx.lineTo(VX + wide, y0);
        ctx.lineTo(VX + (wide * Math.max(z0, 0.35)) / z1, y1);
        ctx.lineTo(VX - (wide * Math.max(z0, 0.35)) / z1, y1);
        ctx.closePath();
        ctx.fill();
      }

      // Carros: faros blancos que vienen, luces rojas que se van
      cars.sort((a, b) => b.z - a.z);
      for (let i = 0; i < cars.length; i++) {
        const c = cars[i];
        if (!reduce) c.z += (c.away ? 1 : -1) * c.v * dt * 0.006 * Math.max(0.6, c.z * 0.25);
        if (c.z < 0.5 || c.z > 42) {
          cars[i] = spawn(c.away, false);
          continue;
        }
        const r = Math.max(0.8, (f * 0.035) / c.z);
        const color = c.away ? "#ff3b3b" : "#fff6d8";
        ctx.save();
        ctx.shadowColor = c.away ? "#ff2020" : "#ffffff";
        ctx.shadowBlur = r * 6;
        ctx.fillStyle = color;
        for (const side of [-0.13, 0.13]) {
          const [x, y] = proj(c.x + side, c.z);
          ctx.beginPath();
          ctx.arc(x, y - r, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Resplandor del horizonte
      const glow = ctx.createLinearGradient(0, H - 40, 0, H + 40);
      glow.addColorStop(0, "rgba(255,46,136,0)");
      glow.addColorStop(0.5, "rgba(255,46,136,0.35)");
      glow.addColorStop(1, "rgba(255,46,136,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, H - 40, w, 80);
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      if (visible && !document.hidden) draw(now, dt);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0, 0);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);

    if (reduce) {
      draw(0, 0);
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="kr-canvas" aria-hidden="true" />;
}
