import type { Metadata } from "next";
import Link from "next/link";
import { Unbounded } from "next/font/google";
import NightRoad from "./_home/NightRoad";
import ContactChat from "./_home/ContactChat";
import NovaBoy from "./_home/NovaBoy";

// Portada pública de krisonroad.com: presentación del estudio, sus apps y
// un chat de contacto que manda los mensajes por correo.
const display = Unbounded({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Krisonroad — Apps que viajan contigo",
  description:
    "Krisonroad es un estudio de apps móviles en Atenas. Creamos Bloomu (Life Plus) y ParkFinder.",
};

const CSS = `
  :root{
    --night:#05040d;
    --night-2:#0b0820;
    --ink:#F4F1FF;
    --ink-soft:#B9B3D6;
    --ink-faint:#7C7699;
    --pink:#ff2e88;
    --sun:#ffb347;
    --cyan:#38f3ff;
    --violet:#9f6eff;
    --lime:#8fe62d;
    --line:rgba(255,255,255,0.09);
    --glass:rgba(255,255,255,0.04);
  }
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{margin:0; background:var(--night); color:var(--ink);
    font-family:var(--font-geist-sans),system-ui,-apple-system,"Segoe UI",sans-serif; line-height:1.6;
    overflow-x:hidden;}
  a{color:inherit;}
  .display{font-family:var(--font-display),system-ui,sans-serif;}

  /* ---------- HERO ---------- */
  .hero{position:relative; height:100svh; min-height:620px; overflow:hidden; isolation:isolate;}
  .kr-canvas{position:absolute; inset:0; width:100%; height:100%; display:block; z-index:-2;}
  .hero::after{content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
    background:
      radial-gradient(ellipse at 50% 120%, transparent 40%, rgba(5,4,13,0.85) 100%),
      linear-gradient(to bottom, rgba(5,4,13,0) 70%, var(--night) 100%);}
  .scan{position:absolute; inset:0; z-index:-1; pointer-events:none; opacity:0.18;
    background:repeating-linear-gradient(to bottom, rgba(255,255,255,0.07) 0 1px, transparent 1px 4px);}
  .nav{position:absolute; top:0; left:0; right:0; display:flex; justify-content:space-between; align-items:center;
    padding:22px clamp(16px,4vw,48px); z-index:2;}
  .logo{display:flex; align-items:center; gap:10px; font-weight:700; letter-spacing:0.02em; text-decoration:none;}
  .logo-mark{width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
    background:linear-gradient(135deg,var(--sun),var(--pink)); color:#1a0420; font-weight:900;
    box-shadow:0 0 24px rgba(255,46,136,0.6);}
  .nav-links{display:flex; gap:clamp(12px,3vw,28px); font-size:0.9rem;}
  .nav-links a{text-decoration:none; color:var(--ink-soft);}
  .nav-links a:hover{color:var(--ink);}
  @media (max-width:480px){ .nav-links a:nth-child(3){display:none;} }
  .hero-copy{position:absolute; left:0; right:0; top:12%; text-align:center; padding:0 16px;}
  .eyebrow{display:inline-flex; gap:10px; align-items:center; font-size:0.72rem; letter-spacing:0.28em;
    text-transform:uppercase; color:var(--cyan); padding:7px 14px; border:1px solid rgba(56,243,255,0.35);
    border-radius:999px; background:rgba(56,243,255,0.06); backdrop-filter:blur(6px);}
  .eyebrow i{width:7px; height:7px; border-radius:50%; background:var(--cyan); box-shadow:0 0 10px var(--cyan);
    animation:blink 1.6s ease-in-out infinite;}
  @keyframes blink{50%{opacity:0.25}}
  .title{margin:22px 0 0; font-weight:900; line-height:0.92; letter-spacing:-0.03em;
    font-size:clamp(2rem,8.6vw,9rem);
    background:linear-gradient(100deg,#fff 0%,#ffe0f0 25%,var(--sun) 40%,var(--pink) 55%,#fff 70%,#fff 100%);
    background-size:250% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
    filter:drop-shadow(0 0 28px rgba(255,46,136,0.45));
    animation:shine 7s linear infinite;}
  @keyframes shine{from{background-position:120% 0} to{background-position:-130% 0}}
  .tagline{margin:18px auto 0; max-width:34ch; font-size:clamp(1.02rem,2.2vw,1.3rem); color:#d9d3f2; text-shadow:0 2px 14px #05040d, 0 0 4px #05040d;}
  .tagline b{color:var(--ink); font-weight:600;}
  .cta{display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:30px;}
  .btn{display:inline-flex; align-items:center; gap:8px; padding:13px 22px; border-radius:999px;
    font-weight:600; text-decoration:none; font-size:0.95rem; transition:transform .2s, box-shadow .2s, background .2s;}
  .btn:hover{transform:translateY(-2px);}
  .btn-hot{background:linear-gradient(135deg,var(--sun),var(--pink)); color:#1a0420;
    box-shadow:0 10px 40px -8px rgba(255,46,136,0.7);}
  .btn-ghost{border:1px solid rgba(255,255,255,0.18); background:rgba(10,6,25,0.6); backdrop-filter:blur(8px);}
  .scroll-hint{position:absolute; bottom:26px; left:50%; translate:-50% 0; font-size:0.7rem; letter-spacing:0.3em;
    text-transform:uppercase; color:var(--ink-faint); display:flex; flex-direction:column; align-items:center; gap:10px;}
  .scroll-hint span{width:1px; height:46px; background:linear-gradient(var(--pink),transparent);
    animation:drip 2s ease-in-out infinite; transform-origin:top;}
  @keyframes drip{0%{transform:scaleY(0)} 60%{transform:scaleY(1)} 100%{transform:scaleY(1); opacity:0}}

  /* ---------- MARQUEE ---------- */
  .marquee{border-block:1px solid var(--line); overflow:hidden; padding:18px 0; background:var(--night-2);}
  .marquee-track{display:flex; width:max-content; animation:slide 38s linear infinite;}
  .marquee-track span{font-family:var(--font-display),sans-serif; font-weight:700; font-size:clamp(1rem,2.4vw,1.6rem);
    padding-inline:28px; white-space:nowrap; color:transparent; -webkit-text-stroke:1px rgba(244,241,255,0.55);}
  .marquee-track span:nth-child(3n+1){color:var(--ink); -webkit-text-stroke:0;}
  .marquee-track em{font-style:normal; color:var(--pink); padding-inline:4px;}
  @keyframes slide{to{transform:translateX(-50%)}}

  /* ---------- SECCIONES ---------- */
  .wrap{max-width:1180px; margin-inline:auto; padding-inline:16px;}
  .section{padding:clamp(80px,12vw,150px) 0;}
  .kicker{font-size:0.75rem; letter-spacing:0.3em; text-transform:uppercase; color:var(--pink); margin:0 0 14px;}
  .h2{font-family:var(--font-display),sans-serif; font-weight:700; font-size:clamp(1.9rem,5vw,3.6rem);
    line-height:1.05; letter-spacing:-0.02em; margin:0 0 20px; max-width:18ch;}
  .lead{color:var(--ink-soft); font-size:1.08rem; max-width:56ch; margin:0;}

  .showcase{display:grid; grid-template-columns:1fr 1fr; gap:clamp(32px,6vw,90px); align-items:center;
    margin-top:clamp(70px,10vw,120px);}
  .showcase.flip .stage{order:2;}
  @media (max-width:860px){ .showcase{grid-template-columns:1fr;} .showcase.flip .stage{order:0;} }
  .stage{position:relative; display:grid; place-items:center; padding:40px 0;}
  .halo{position:absolute; width:min(520px,90vw); aspect-ratio:1; border-radius:50%; filter:blur(60px); opacity:0.55;
    animation:breathe 8s ease-in-out infinite;}
  @keyframes breathe{50%{transform:scale(1.12); opacity:0.75}}
  .app-name{font-family:var(--font-display),sans-serif; font-weight:900; font-size:clamp(2.2rem,6vw,4.4rem);
    letter-spacing:-0.03em; line-height:1; margin:0 0 6px;}
  .app-sub{color:var(--ink-faint); text-transform:uppercase; letter-spacing:0.22em; font-size:0.75rem; margin:0 0 22px;}
  .feats{list-style:none; padding:0; margin:26px 0 30px; display:grid; gap:14px;}
  .feats li{display:flex; gap:14px; align-items:flex-start; color:var(--ink-soft);}
  .feats b{color:var(--ink); font-weight:600;}
  .dot{flex:none; width:30px; height:30px; border-radius:9px; display:grid; place-items:center; font-size:0.95rem;
    background:var(--glass); border:1px solid var(--line);}

  /* ---------- TELÉFONOS ---------- */
  .phone{position:relative; width:min(290px,72vw); aspect-ratio:9/19; border-radius:44px; padding:12px;
    background:linear-gradient(145deg,#2a2640,#0d0b18); box-shadow:
      0 0 0 1px rgba(255,255,255,0.12) inset, 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 60px -10px var(--glow);
    animation:float 7s ease-in-out infinite; transform-style:preserve-3d;}
  .flip .phone{animation-delay:-3.5s;}
  @keyframes float{0%,100%{transform:translateY(0) rotateX(6deg) rotateY(-10deg)} 50%{transform:translateY(-18px) rotateX(2deg) rotateY(-4deg)}}
  .notch{position:absolute; top:20px; left:50%; translate:-50% 0; width:90px; height:24px; border-radius:20px; background:#000; z-index:3;}
  .screen{position:relative; height:100%; border-radius:34px; overflow:hidden; padding:54px 16px 16px;}

  /* Bloomu */
  .bloomu{--glow:rgba(143,230,45,0.55);}
  .bloomu .screen{background:linear-gradient(180deg,#f4fbe9,#e3f3cc); color:#1c2318;}
  .s-top{display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:0.95rem;}
  .pill{font-size:0.7rem; font-weight:700; padding:4px 9px; border-radius:999px; background:#1c2318; color:#d9f7b0;}
  .ring{margin:18px auto 14px; width:62%; aspect-ratio:1; border-radius:50%;
    --p:71%; background:conic-gradient(#4c8f00 0 var(--p), #cfe6ad var(--p) 100%); display:grid; place-items:center;
    animation:fill 3.5s ease-out both;}
  @property --p{syntax:'<percentage>'; inherits:false; initial-value:0%;}
  @keyframes fill{from{--p:0%}}
  .ring-in{width:78%; aspect-ratio:1; border-radius:50%; background:#f4fbe9; display:grid; place-items:center; text-align:center;}
  .ring-in b{display:block; font-size:1.5rem; line-height:1;}
  .ring-in small{font-size:0.62rem; color:#52604a;}
  .macro{display:grid; grid-template-columns:62px 1fr; align-items:center; gap:8px; font-size:0.66rem; margin:7px 0; color:#52604a;}
  .bar{height:7px; border-radius:9px; background:#d5e8bb; overflow:hidden;}
  .bar i{display:block; height:100%; border-radius:9px; transform-origin:left; animation:grow 2.4s cubic-bezier(.2,.8,.2,1) both;}
  @keyframes grow{from{transform:scaleX(0)}}
  .water{display:flex; gap:5px; margin:14px 0 12px;}
  .water span{flex:1; height:22px; border-radius:6px 6px 10px 10px; background:#d5e8bb;}
  .water span.on{background:linear-gradient(#7fd3ff,#2f9bff);}
  .meal{display:flex; gap:10px; align-items:center; background:#fff; border-radius:14px; padding:10px; font-size:0.72rem;
    box-shadow:0 6px 18px -8px rgba(28,35,24,0.35);}
  .meal .em{font-size:1.3rem;}
  .meal small{display:block; color:#8b9382;}

  /* ParkFinder */
  .park{--glow:rgba(56,243,255,0.5);}
  .park .screen{padding:0; background:#1b2233;}
  .map{position:absolute; inset:0;
    background:
      linear-gradient(90deg, transparent 47%, #2c3650 47% 53%, transparent 53%) 0 0/120px 100%,
      linear-gradient(0deg, transparent 46%, #2c3650 46% 54%, transparent 54%) 0 0/100% 140px,
      linear-gradient(90deg, transparent 48.5%, #252e44 48.5% 51.5%, transparent 51.5%) 60px 0/60px 100%,
      #161c2b;}
  .map::before{content:""; position:absolute; left:-20%; top:40%; width:140%; height:26px; background:#36425f; transform:rotate(-24deg);}
  .map::after{content:""; position:absolute; right:-10%; top:8%; width:46%; height:30%; border-radius:30px;
    background:radial-gradient(circle at 40% 40%,#1f3a2b,#183022); opacity:0.9;}
  .pin{position:absolute; z-index:2; width:30px; height:30px; border-radius:50% 50% 50% 0; rotate:-45deg;
    display:grid; place-items:center; box-shadow:0 6px 14px rgba(0,0,0,0.5);}
  .pin b{rotate:45deg; color:#fff; font-weight:900; font-size:0.85rem;}
  .pin.g{background:#19c25a;}
  .pin.g::after{content:""; position:absolute; inset:-8px; border-radius:50%; border:2px solid #19c25a; animation:ping 1.8s ease-out infinite;}
  @keyframes ping{from{transform:scale(0.6); opacity:1} to{transform:scale(1.8); opacity:0}}
  .pin.r{background:#e5484d;}
  .pin.k{background:#111;}
  .me{position:absolute; z-index:2; left:46%; top:58%; width:16px; height:16px; border-radius:50%; background:#2f7bff;
    border:3px solid #fff; box-shadow:0 0 0 8px rgba(47,123,255,0.25);}
  .route{position:absolute; inset:0; z-index:1;}
  .route path{stroke-dasharray:6 8; animation:dash 1.2s linear infinite;}
  @keyframes dash{to{stroke-dashoffset:-28}}
  .sheet{position:absolute; z-index:3; left:10px; right:10px; bottom:10px; background:#fff; color:#0b1630; border-radius:20px;
    padding:14px; display:flex; gap:12px; align-items:center; box-shadow:0 -10px 30px rgba(0,0,0,0.35);
    animation:pop 4s ease-in-out infinite;}
  @keyframes pop{0%,8%{transform:translateY(120%)} 18%,85%{transform:translateY(0)} 100%{transform:translateY(120%)}}
  .sheet .pin{position:relative; flex:none; width:34px; height:34px;}
  .sheet .pin::after{display:none;}
  .sheet b{font-size:0.85rem;}
  .sheet small{display:block; color:#3e4c6a; font-size:0.7rem;}
  .pf-head{position:absolute; z-index:3; top:50px; left:12px; right:12px; background:rgba(255,255,255,0.95); color:#0b1630;
    border-radius:14px; padding:9px 12px; font-size:0.72rem; font-weight:700; display:flex; justify-content:space-between;}
  .pf-head span{color:#19a34e;}

  /* ---------- VALORES ---------- */
  .values{display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-top:50px;}
  .value{position:relative; padding:28px; border-radius:22px; border:1px solid var(--line); background:var(--glass);
    overflow:hidden; transition:transform .3s, border-color .3s;}
  .value:hover{transform:translateY(-4px); border-color:rgba(255,46,136,0.45);}
  .value::before{content:""; position:absolute; width:180px; height:180px; right:-60px; top:-60px; border-radius:50%;
    background:var(--c); filter:blur(50px); opacity:0.35;}
  .value .big{font-family:var(--font-display),sans-serif; font-weight:900; font-size:3.4rem; line-height:1; margin:0 0 10px;
    background:linear-gradient(180deg,#fff,var(--c)); -webkit-background-clip:text; background-clip:text; color:transparent;}
  .value h3{margin:0 0 6px; font-size:1.05rem;}
  .value p{margin:0; color:var(--ink-soft); font-size:0.95rem;}

  /* ---------- CONTACTO ---------- */
  .contact{position:relative; border-radius:30px; padding:clamp(28px,5vw,60px); overflow:hidden;
    border:1px solid var(--line); background:
      radial-gradient(circle at 0% 0%, rgba(255,46,136,0.25), transparent 50%),
      radial-gradient(circle at 100% 100%, rgba(56,243,255,0.18), transparent 50%), var(--night-2);}
  .chat{margin-top:30px; max-width:640px; display:flex; flex-direction:column; gap:14px;}
  .bubble{max-width:85%; padding:14px 18px; border-radius:20px; line-height:1.5; overflow-wrap:break-word;}
  .bubble.them{align-self:flex-start; background:rgba(255,255,255,0.07); border:1px solid var(--line); border-bottom-left-radius:6px;}
  .bubble.mine{align-self:flex-end; background:linear-gradient(135deg,var(--sun),var(--pink)); color:#1a0420;
    border-bottom-right-radius:6px; white-space:pre-wrap;}
  .bubble small{display:block; font-size:0.75rem; opacity:0.7; margin-bottom:4px;}
  .typing{display:inline-flex; gap:5px;}
  .typing i{width:7px; height:7px; border-radius:50%; background:var(--ink-soft); animation:blink 1s infinite;}
  .typing i:nth-child(2){animation-delay:.15s} .typing i:nth-child(3){animation-delay:.3s}
  .composer{display:grid; gap:10px; padding:14px; border-radius:22px; border:1px solid var(--line);
    background:rgba(5,4,13,0.55); backdrop-filter:blur(8px);}
  .composer .row{display:grid; grid-template-columns:1fr 1fr; gap:10px;}
  @media (max-width:560px){ .composer .row{grid-template-columns:1fr;} }
  .composer input, .composer textarea{width:100%; font:inherit; color:var(--ink); background:rgba(255,255,255,0.05);
    border:1px solid var(--line); border-radius:14px; padding:12px 14px; outline:none; transition:border-color .2s;}
  .composer textarea{resize:vertical; min-height:96px;}
  .composer input:focus, .composer textarea:focus{border-color:var(--pink);}
  .composer input::placeholder, .composer textarea::placeholder{color:var(--ink-faint);}
  .composer .send{display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;}
  .composer .hint{font-size:0.8rem; color:var(--ink-faint);}
  .composer button{border:0; cursor:pointer; font:inherit; font-weight:700; padding:12px 22px; border-radius:999px;
    background:linear-gradient(135deg,var(--sun),var(--pink)); color:#1a0420; transition:transform .2s, opacity .2s;}
  .composer button:hover{transform:translateY(-2px);}
  .composer button:disabled{opacity:0.5; cursor:default; transform:none;}
  .hp{position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;}
  .err{color:#ff8fa3; font-size:0.9rem; margin:0;}

  footer.foot{padding:40px 0 50px; color:var(--ink-faint); font-size:0.85rem; display:flex; justify-content:space-between;
    gap:16px; flex-wrap:wrap; border-top:1px solid var(--line); margin-top:clamp(70px,10vw,120px);}

  /* Aparecer al hacer scroll (solo navegadores que lo soportan; los demás lo ven fijo) */
  @supports (animation-timeline: view()){
    .reveal{animation:rise linear both; animation-timeline:view(); animation-range:entry 0% cover 28%;}
    @keyframes rise{from{opacity:0; transform:translateY(60px) scale(0.97)}}
  }
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{animation:none !important; transition:none !important;}
  }
`;

export default function Home() {
  const year = new Date().getFullYear();
  const words = ["NUTRICIÓN", "MOVILIDAD", "TIEMPO REAL", "ANDROID", "VIDEOJUEGOS", "NOVA BOY", "SUGERENCIAS BIENVENIDAS"];
  const band = [...words, ...words];

  return (
    <div className={display.variable}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ============ HERO ============ */}
      <header className="hero">
        <NightRoad />
        <div className="scan" />
        <nav className="nav">
          <Link href="/" className="logo display">
            <span className="logo-mark">K</span>Krisonroad
          </Link>
          <div className="nav-links">
            <a href="#apps">Apps</a>
            <a href="#novaboy">Nova Boy</a>
            <a href="#estudio">Estudio</a>
            <a href="#contacto">Contacto</a>
          </div>
        </nav>

        <div className="hero-copy">
          <span className="eyebrow">
            <i /> Apps y videojuegos
          </span>
          <h1 className="title display">KRISONROAD</h1>
          <p className="tagline">
            Construimos <b>apps y juegos que viajan contigo</b>: del plato a la calle… y hasta otros mundos.
          </p>
          <div className="cta">
            <a className="btn btn-hot" href="#apps">
              Ver nuestras apps →
            </a>
            <a className="btn btn-ghost" href="#novaboy">
              Nova Boy 🎮
            </a>
          </div>
        </div>

        <div className="scroll-hint" aria-hidden="true">
          Baja
          <span />
        </div>
      </header>

      {/* ============ BANDA ============ */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {band.map((w, i) => (
            <span key={i}>
              {w}
              <em>✦</em>
            </span>
          ))}
        </div>
      </div>

      <main className="wrap">
        {/* ============ APPS ============ */}
        <section className="section" id="apps">
          <p className="kicker reveal">Nuestras apps</p>
          <h2 className="h2 reveal">Dos apps. Un mismo camino.</h2>
          <p className="lead reveal">
            Cuidamos lo que comes y te ayudamos a encontrar dónde estacionar. Apps simples por fuera, muy
            pensadas por dentro.
          </p>

          {/* Bloomu */}
          <div className="showcase">
            <div className="stage reveal">
              <div className="halo" style={{ background: "radial-gradient(circle,#8fe62d,#2b6a00 60%,transparent 70%)" }} />
              <div className="phone bloomu" role="img" aria-label="Pantalla de Bloomu con el resumen de calorías del día">
                <div className="notch" />
                <div className="screen">
                  <div className="s-top">
                    <span>Hoy</span>
                    <span className="pill">🔥 12 días</span>
                  </div>
                  <div className="ring">
                    <div className="ring-in">
                      <div>
                        <b>1 420</b>
                        <small>de 2 000 kcal</small>
                      </div>
                    </div>
                  </div>
                  <div className="macro">
                    Proteína
                    <div className="bar">
                      <i style={{ width: "78%", background: "#4c8f00" }} />
                    </div>
                  </div>
                  <div className="macro">
                    Carbos
                    <div className="bar">
                      <i style={{ width: "56%", background: "#f2a93b", animationDelay: ".2s" }} />
                    </div>
                  </div>
                  <div className="macro">
                    Grasas
                    <div className="bar">
                      <i style={{ width: "42%", background: "#e5484d", animationDelay: ".4s" }} />
                    </div>
                  </div>
                  <div className="water">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className={i < 5 ? "on" : ""} />
                    ))}
                  </div>
                  <div className="meal">
                    <span className="em">🥑</span>
                    <div>
                      <b>Tostada de aguacate</b>
                      <small>320 kcal · analizada con IA</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal">
              <p className="app-sub">Nutrición y bienestar</p>
              <h3 className="app-name" style={{ color: "var(--lime)" }}>
                Bloomu
              </h3>
              <p className="lead">
                También conocida como <b>Life Plus</b>. Tu diario de comidas, medidas y progreso, con
                especialistas de verdad a tu lado.
              </p>
              <ul className="feats">
                <li>
                  <span className="dot">📸</span>
                  <span>
                    <b>Foto al plato</b>, y la IA estima calorías y nutrientes.
                  </span>
                </li>
                <li>
                  <span className="dot">📈</span>
                  <span>
                    <b>Tu progreso</b> en peso, medidas, fotos, agua, sueño y ayuno.
                  </span>
                </li>
                <li>
                  <span className="dot">🧑‍⚕️</span>
                  <span>
                    <b>Especialistas</b> en nutrición que siguen tu evolución.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ParkFinder */}
          <div className="showcase flip">
            <div className="stage reveal">
              <div className="halo" style={{ background: "radial-gradient(circle,#38f3ff,#1747c9 60%,transparent 70%)" }} />
              <div className="phone park" role="img" aria-label="Mapa de ParkFinder con lugares de estacionamiento liberados">
                <div className="notch" />
                <div className="screen">
                  <div className="map" />
                  <svg className="route" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M50 118 C 45 100, 30 92, 28 72" fill="none" stroke="#38f3ff" strokeWidth="1.4" />
                  </svg>
                  <div className="pf-head">
                    ParkFinder <span>● 3 lugares cerca</span>
                  </div>
                  <span className="pin g" style={{ left: "22%", top: "33%" }}>
                    <b>P</b>
                  </span>
                  <span className="pin g" style={{ left: "70%", top: "45%" }}>
                    <b>P</b>
                  </span>
                  <span className="pin r" style={{ left: "62%", top: "24%" }}>
                    <b>P</b>
                  </span>
                  <span className="pin k" style={{ left: "16%", top: "62%" }}>
                    <b>P</b>
                  </span>
                  <span className="me" />
                  <div className="sheet">
                    <span className="pin g">
                      <b>P</b>
                    </span>
                    <div>
                      <b>Lugar libre</b>
                      <small>a 120 m · liberado hace 2 min</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal">
              <p className="app-sub">Estacionamiento en tiempo real</p>
              <h3 className="app-name" style={{ color: "var(--cyan)" }}>
                ParkFinder
              </h3>
              <p className="lead">
                Sabe dónde dejaste tu carro y, cuando te vas, avisa a los conductores cercanos de que el lugar
                quedó libre. Sin tocar nada.
              </p>
              <ul className="feats">
                <li>
                  <span className="dot">🚗</span>
                  <span>
                    <b>Detección automática</b> de dónde estacionas, con GPS y el Bluetooth de tu carro.
                  </span>
                </li>
                <li>
                  <span className="dot">🟢</span>
                  <span>
                    <b>Lugares liberados</b> en el mapa, al momento, cerca de ti.
                  </span>
                </li>
                <li>
                  <span className="dot">🔒</span>
                  <span>
                    <b>Tus recorridos se quedan en tu teléfono.</b> Solo se comparte el lugar que liberas.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============ VIDEOJUEGO ============ */}
        <NovaBoy />

        {/* ============ ESTUDIO ============ */}
        <section className="section" id="estudio">
          <p className="kicker reveal">El estudio</p>
          <h2 className="h2 reveal">Pequeño, obsesivo y en camino.</h2>
          <p className="lead reveal">
            Krisonroad es un estudio independiente de apps móviles. Diseñamos, programamos y probamos
            cada app en la calle, con datos reales, antes de que llegue a tus manos.
          </p>
          <div className="values">
            <div className="value reveal" style={{ ["--c" as string]: "#ff2e88" }}>
              <p className="big">2</p>
              <h3>Apps en camino</h3>
              <p>Bloomu y ParkFinder, para Android. Y Nova Boy, nuestro primer videojuego.</p>
            </div>
            <div className="value reveal" style={{ ["--c" as string]: "#ffb347" }}>
              <p className="big">24/7</p>
              <h3>Funcionan solas</h3>
              <p>ParkFinder detecta y avisa en segundo plano, sin que abras la app.</p>
            </div>
          </div>
        </section>

        {/* ============ CONTACTO ============ */}
        <section id="contacto">
          <div className="contact reveal">
            <p className="kicker">Contacto</p>
            <h2 className="h2" style={{ marginBottom: 0 }}>
              ¿Hablamos?
            </h2>
            <p className="lead" style={{ marginTop: 14 }}>
              ¿Una idea, una sugerencia o algo que no funciona? Escríbenos aquí y te leemos.
            </p>
            <ContactChat />
          </div>
        </section>

        <footer className="foot">
          <span>© {year} Krisonroad</span>
        </footer>
      </main>
    </div>
  );
}
