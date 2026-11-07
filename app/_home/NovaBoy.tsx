import { Press_Start_2P } from "next/font/google";

// Sección del videojuego Nova Boy en la portada: escena animada solo con CSS
// (Nova vuela en su nave, dispara a un enemigo y Froggy le habla),
// más la descripción y el cartel "en construcción".
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel" });

const CSS = `
  .nb{position:relative; width:100vw; margin-left:calc(50% - 50vw); padding:clamp(80px,11vw,140px) 0;
    overflow:hidden; isolation:isolate; background:#07060f;}
  .nb::before{content:""; position:absolute; inset:0; z-index:-2;
    background:url(/novaboy/stage.webp) center/cover no-repeat; opacity:0.35; filter:saturate(1.15);
    animation:nbKen 30s ease-in-out infinite alternate;}
  .nb::after{content:""; position:absolute; inset:0; z-index:-1;
    background:linear-gradient(180deg,#05040d 0%,rgba(5,4,13,0.55) 18%,rgba(5,4,13,0.55) 80%,#05040d 100%);}
  @keyframes nbKen{from{transform:scale(1.05) translateX(-1.5%)} to{transform:scale(1.18) translateX(1.5%)}}
  .nb-in{max-width:1180px; margin-inline:auto; padding-inline:16px;}
  .nb .pix{font-family:var(--font-pixel),monospace;}
  .nb-kicker{font-family:var(--font-pixel),monospace; font-size:0.62rem; letter-spacing:0.18em; color:#ffb347; margin:0 0 18px;}
  .nb-title{font-family:var(--font-pixel),monospace; font-size:clamp(2rem,7vw,4.6rem); line-height:1.05; margin:0 0 18px;
    color:#ffe9c7; text-shadow:4px 4px 0 #ff6a1a, 8px 8px 0 #8a2a00, 0 0 40px rgba(255,140,40,0.55);
    animation:nbTitle 3s steps(2) infinite;}
  @keyframes nbTitle{50%{text-shadow:4px 4px 0 #ff6a1a, 8px 8px 0 #8a2a00, 0 0 60px rgba(56,243,255,0.5)}}
  .nb-lead{color:#d9d3f2; font-size:1.08rem; max-width:58ch; margin:0 0 26px;}

  /* ---------- Escenario ---------- */
  .stage-nb{position:relative; height:clamp(320px,42vw,470px); border-radius:26px; overflow:hidden; margin:34px 0 40px;
    border:3px solid #1d1838; box-shadow:0 0 0 1px rgba(255,255,255,0.06) inset, 0 30px 90px -30px rgba(255,120,40,0.6);
    background:url(/novaboy/stage.webp) center 35%/cover no-repeat;}
  .stage-nb::after{content:""; position:absolute; inset:0; pointer-events:none;
    background:repeating-linear-gradient(0deg,rgba(0,0,0,0.12) 0 2px,transparent 2px 4px); mix-blend-mode:multiply;}
  .sky-shade{position:absolute; inset:0; background:linear-gradient(180deg,rgba(10,6,30,0.15),rgba(10,6,30,0.55));}
  .fireflies i{position:absolute; width:4px; height:4px; background:#ffe27a; box-shadow:0 0 8px 2px #ffb347; border-radius:1px;
    animation:nbFly 6s ease-in-out infinite;}
  @keyframes nbFly{0%,100%{transform:translate(0,0); opacity:.2} 50%{transform:translate(18px,-26px); opacity:1}}

  /* suelo pixel que se desplaza */
  .ground{position:absolute; left:0; right:0; bottom:0; height:22%; z-index:2;
    background:
      linear-gradient(#3fb43a 0 14%, #2a8a2c 14% 22%, transparent 22%),
      repeating-linear-gradient(90deg,#8a3b17 0 24px,#7a3212 24px 48px);
    background-size:48px 100%, 48px 100%; box-shadow:0 -4px 0 #1a4a1a inset;
    animation:nbGround 0.9s linear infinite; image-rendering:pixelated;}
  .ground::before{content:""; position:absolute; left:0; right:0; top:-8px; height:10px;
    background:repeating-linear-gradient(90deg,#4fd047 0 6px,transparent 6px 12px,#3fb43a 12px 18px,transparent 18px 30px);
    animation:inherit;}
  @keyframes nbGround{to{background-position:-48px 0,-48px 0}}

  /* Nova en su nave: vuela por la escena con un recorrido "al azar" (12 s) */
  .ship{position:absolute; z-index:4; left:14%; bottom:34%; width:clamp(150px,19vw,230px);
    animation:nbFly 12s ease-in-out infinite;}
  .ship .body{position:relative; animation:nbHover 1.3s ease-in-out infinite alternate;}
  .ship img{display:block; width:100%; image-rendering:pixelated; filter:drop-shadow(0 0 16px rgba(255,140,40,0.5));}
  @keyframes nbHover{from{transform:translateY(-4px)} to{transform:translateY(5px)}}
  @keyframes nbFly{
    0%{left:14%; bottom:34%; rotate:0deg}
    9%{left:20%; bottom:46%; rotate:-4deg}
    18%{left:26%; bottom:30%; rotate:5deg}
    28%{left:6%; bottom:50%; rotate:-7deg}
    38%{left:3%; bottom:28%; rotate:4deg}
    46%,54%{left:24%; bottom:36%; rotate:0deg}
    64%{left:50%; bottom:34%; rotate:6deg}
    72%{left:54%; bottom:26%; rotate:2deg}
    82%{left:34%; bottom:42%; rotate:-6deg}
    92%{left:18%; bottom:28%; rotate:3deg}
    100%{left:14%; bottom:34%; rotate:0deg}}
  /* fuego del propulsor y estela */
  .ship .fire{position:absolute; left:-6%; top:66%; width:22%; height:18%; border-radius:50%;
    background:radial-gradient(closest-side,#fff,#38f3ff 45%,rgba(56,243,255,0) 75%);
    filter:blur(2px); animation:nbFire .12s steps(2) infinite;}
  @keyframes nbFire{50%{transform:scale(1.25,0.8); opacity:.7}}
  .ship .trail i{position:absolute; left:-4%; top:71%; width:8px; height:8px; background:#38f3ff; box-shadow:0 0 10px #38f3ff;
    opacity:0; animation:nbTrail .9s linear infinite;}
  .ship .trail i:nth-child(2){animation-delay:.3s; top:76%} .ship .trail i:nth-child(3){animation-delay:.6s; top:67%}
  @keyframes nbTrail{0%{opacity:1; transform:translateX(0) scale(1)} 100%{opacity:0; transform:translateX(-120px) scale(.3)}}

  /* disparo: sale de la punta de la nave cuando se queda quieta (46–54 %) */
  .laser{position:absolute; z-index:5; bottom:calc(36% + clamp(150px,19vw,230px) * 0.2); width:54px; height:8px; border-radius:4px;
    background:linear-gradient(90deg,transparent,#38f3ff 30%,#fff); box-shadow:0 0 14px #38f3ff, 0 0 30px #38f3ff;
    opacity:0; animation:nbLaser 12s linear infinite;}
  @keyframes nbLaser{0%,47.9%{opacity:0; left:calc(24% + clamp(150px,19vw,230px))}
    48%{opacity:1; left:calc(24% + clamp(150px,19vw,230px))} 53.9%{opacity:1; left:61%} 54%,100%{opacity:0; left:61%}}
  .flash{position:absolute; z-index:5; left:calc(24% + clamp(150px,19vw,230px) - 14px); bottom:calc(36% + clamp(150px,19vw,230px) * 0.2 - 10px);
    width:30px; height:30px; border-radius:50%; background:radial-gradient(#fff,#38f3ff 40%,transparent 70%);
    opacity:0; animation:nbFlash 12s infinite;}
  @keyframes nbFlash{0%,47.9%{opacity:0; transform:scale(.4)} 48%{opacity:1; transform:scale(1.4)} 50%,100%{opacity:0; transform:scale(.4)}}

  /* enemigo: medusa espacial que llega volando */
  .slime{position:absolute; z-index:3; bottom:calc(36% + clamp(150px,19vw,230px) * 0.2 - 22px); width:clamp(48px,6vw,70px); height:clamp(38px,4.8vw,56px);
    animation:nbSlimeMove 12s linear infinite;}
  .slime b{position:absolute; inset:0; border-radius:50% 50% 30% 30% / 70% 70% 30% 30%;
    background:radial-gradient(circle at 35% 30%,#d58bff 0 12%,#9a3cf0 13% 60%,#5f1aa8 61%);
    box-shadow:inset 0 -5px 0 #3e0e74, 0 0 22px rgba(170,80,255,0.6); animation:nbSquish .5s ease-in-out infinite;}
  .slime b::before,.slime b::after{content:""; position:absolute; top:36%; width:16%; height:22%; background:#fff;
    border-radius:2px; box-shadow:inset 3px 0 0 #160530;}
  .slime b::before{left:24%} .slime b::after{left:56%}
  @keyframes nbSquish{50%{transform:scale(1.08,.9) translateY(-8%)}}
  @keyframes nbSlimeMove{0%,30%{left:104%; opacity:1; transform:scale(1)} 54%{left:61%; opacity:1; transform:scale(1)}
    55%{left:61%; transform:scale(1.35); filter:brightness(3)} 59%{left:61%; opacity:0; transform:scale(.2)}
    59.1%,100%{left:104%; opacity:0}}
  .boom{position:absolute; z-index:6; left:63%; bottom:calc(36% + clamp(150px,19vw,230px) * 0.2); width:10px; height:10px; opacity:0; animation:nbBoom 12s infinite;}
  .boom i{position:absolute; width:8px; height:8px; background:#ffe27a; box-shadow:0 0 10px #ffb347;}
  .boom i:nth-child(1){--x:-50px; --y:-40px} .boom i:nth-child(2){--x:44px; --y:-52px} .boom i:nth-child(3){--x:-36px; --y:30px}
  .boom i:nth-child(4){--x:52px; --y:24px} .boom i:nth-child(5){--x:4px; --y:-70px} .boom i:nth-child(6){--x:-62px; --y:-8px}
  @keyframes nbBoom{0%,54.5%{opacity:0} 55%{opacity:1} 61%{opacity:0} 100%{opacity:0}}
  .boom i{animation:nbShard 12s ease-out infinite;}
  @keyframes nbShard{0%,54.5%{transform:translate(0,0) scale(1)} 61%,100%{transform:translate(var(--x),var(--y)) scale(.3)}}
  .score{position:absolute; z-index:6; left:60%; bottom:calc(36% + clamp(150px,19vw,230px) * 0.2 + 30px); font-family:var(--font-pixel),monospace;
    font-size:0.8rem; color:#ffe27a; text-shadow:2px 2px 0 #8a2a00; opacity:0; animation:nbScore 12s infinite;}
  @keyframes nbScore{0%,55%{opacity:0; transform:translateY(0)} 56%{opacity:1} 63%{opacity:0; transform:translateY(-40px)} 100%{opacity:0}}

  /* HUD */
  .hud{position:absolute; z-index:7; top:16px; left:18px; right:18px; display:flex; justify-content:space-between; align-items:center;
    font-family:var(--font-pixel),monospace; font-size:clamp(0.5rem,1.1vw,0.72rem); color:#fff; text-shadow:2px 2px 0 #000;}
  .hearts{color:#ff3b5c; letter-spacing:4px; font-size:1.3em;}
  .hud .lvl{background:rgba(0,0,0,0.45); padding:7px 10px; border:2px solid #fff; border-radius:4px;}

  /* diálogo de Froggy */
  .dlg{position:absolute; z-index:8; right:clamp(10px,2.5vw,26px); top:clamp(54px,7vw,70px); width:min(66%,560px);
    display:flex; gap:12px; align-items:center; padding:12px; border:3px solid #fff; border-radius:8px;
    background:rgba(8,14,32,0.88); box-shadow:6px 6px 0 rgba(0,0,0,0.5); animation:nbDlg 6s steps(1) infinite;}
  @keyframes nbDlg{0%,74%{opacity:1} 75%,100%{opacity:1}}
  .dlg img{width:clamp(46px,6vw,68px); height:clamp(46px,6vw,68px); border-radius:6px; border:2px solid #3fb43a; flex:none; object-fit:cover;}
  .dlg .nm{font-family:var(--font-pixel),monospace; font-size:clamp(0.5rem,1vw,0.68rem); color:#ffd84a; margin:0 0 8px;}
  .dlg .tx{font-family:var(--font-pixel),monospace; font-size:clamp(0.48rem,1vw,0.66rem); line-height:1.7; color:#fff; margin:0;
  }
  .dlg .tx span{display:block; overflow:hidden; white-space:nowrap; width:0;}
  .dlg .tx .l1{animation:nbType1 7s steps(41) infinite;}
  .dlg .tx .l2{animation:nbType2 7s steps(28) infinite;}
  @keyframes nbType1{0%,4%{width:0} 34%,100%{width:41ch}}
  @keyframes nbType2{0%,36%{width:0} 58%,100%{width:28ch}}
  .dlg .nx{position:absolute; right:10px; bottom:6px; color:#ffd84a; font-size:0.7rem; animation:blink .8s steps(1) infinite;}
  @media (max-width:640px){ .dlg .tx span{display:inline; white-space:normal; width:auto; animation:none;} }

  /* ---------- Info + construcción ---------- */
  .nb-grid{display:grid; grid-template-columns:1.15fr 0.85fr; gap:clamp(28px,5vw,64px); align-items:start;}
  @media (max-width:860px){ .nb-grid{grid-template-columns:1fr;} }
  .chips{display:flex; flex-wrap:wrap; gap:10px; margin:0 0 28px; padding:0; list-style:none;}
  .chips li{font-family:var(--font-pixel),monospace; font-size:0.56rem; padding:10px 12px; border:2px solid rgba(255,255,255,0.16);
    border-radius:6px; background:rgba(255,255,255,0.05); color:#e9e4ff;}
  .build{position:relative; padding:22px; border-radius:16px; background:rgba(10,8,24,0.75); border:2px solid #ffb800; overflow:hidden;}
  .tape{position:absolute; left:-10%; right:-10%; top:0; height:14px;
    background:repeating-linear-gradient(-45deg,#ffb800 0 16px,#14110a 16px 32px); animation:nbTape 1.2s linear infinite;}
  @keyframes nbTape{to{background-position:45px 0}}
  .build h4{font-family:var(--font-pixel),monospace; font-size:0.8rem; color:#ffb800; margin:12px 0 12px; display:flex; gap:10px; align-items:center;}
  .build p{margin:0 0 14px; color:#cfc8ea; font-size:0.95rem;}
  .bar{height:18px; border:2px solid #fff; border-radius:4px; padding:2px; background:#000;}
  .bar i{display:block; height:100%; width:38%; background:repeating-linear-gradient(90deg,#3fb43a 0 10px,#57d64f 10px 12px);
    animation:nbFill 2.4s cubic-bezier(.2,.8,.2,1) both, nbPulse 1.6s ease-in-out 2.4s infinite;}
  @keyframes nbFill{from{width:0}} @keyframes nbPulse{50%{filter:brightness(1.4)}}
  .bar-l{display:flex; justify-content:space-between; font-family:var(--font-pixel),monospace; font-size:0.52rem; color:#fff; margin-top:8px;}
  .poster{position:relative; justify-self:center; width:min(360px,80vw); transform:rotate(3deg); animation:nbPoster 7s ease-in-out infinite;}
  .poster img{display:block; width:100%; border-radius:14px; border:3px solid #2a2448;
    box-shadow:0 30px 80px -20px rgba(255,120,40,0.7), 0 0 0 1px rgba(255,255,255,0.08);}
  .poster span{position:absolute; top:18px; right:-14px; transform:rotate(10deg); font-family:var(--font-pixel),monospace; font-size:0.6rem;
    padding:10px 12px; background:#ffb800; color:#14110a; border-radius:4px; box-shadow:4px 4px 0 #000;}
  @keyframes nbPoster{50%{transform:rotate(1deg) translateY(-12px)}}
  .nb-controls{display:flex; gap:10px; flex-wrap:wrap; margin-top:20px; font-size:0.85rem; color:#b9b3d6;}
  .key{font-family:var(--font-pixel),monospace; font-size:0.55rem; padding:6px 8px; border:2px solid #fff; border-bottom-width:4px; border-radius:4px; color:#fff;}
  @media (prefers-reduced-motion: reduce){ .nb *{animation:none !important;} .dlg .tx span{width:auto;} }
`;

const flies = [
  [12, 30, 0], [28, 18, 1.2], [44, 36, 2.4], [70, 22, 0.6], [84, 40, 3.1], [58, 14, 4.2], [36, 52, 1.8], [90, 16, 2.9],
];

export default function NovaBoy() {
  return (
    <section className={`nb ${pixel.variable}`} id="novaboy" aria-labelledby="nb-title">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="nb-in">
        <p className="nb-kicker reveal">▶ OUR VIDEO GAME</p>
        <h2 className="nb-title reveal" id="nb-title">
          NOVA BOY
        </h2>
        <p className="nb-lead reveal">
          A little astronaut, an unknown world and a single mission: <b>find his love</b>. Run, jump and shoot
          your way across floating cliffs, moving platforms and strange creatures, with help from friends like
          Froggy.
        </p>

        {/* Escena animada */}
        <div className="stage-nb reveal" role="img" aria-label="Nova flies his ship across the scene and shoots an enemy while Froggy talks to him">
          <div className="sky-shade" />
          <div className="fireflies" aria-hidden="true">
            {flies.map(([l, t, d], i) => (
              <i key={i} style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${d}s` }} />
            ))}
          </div>
          <div className="hud" aria-hidden="true">
            <span className="hearts">♥♥♥</span>
            <span className="lvl">WORLD 1-1</span>
          </div>
          <div className="dlg" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/novaboy/froggy.webp" alt="" />
            <div>
              <p className="nm">FROGGY</p>
              <p className="tx">
                <span className="l1">Kris! Let&apos;s hurry and build the game,</span>{" "}
                <span className="l2">we don&apos;t have enough time!</span>
              </p>
            </div>
            <span className="nx">▼</span>
          </div>
          <div className="slime">
            <b />
          </div>
          <div className="ship">
            <div className="body">
              <span className="trail" aria-hidden="true">
                <i /><i /><i />
              </span>
              <span className="fire" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/novaboy/nave.png" alt="" />
            </div>
          </div>
          <div className="flash" />
          <div className="laser" />
          <div className="boom" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </div>
          <span className="score" aria-hidden="true">+100</span>
          <div className="ground" />
        </div>

        <div className="nb-grid">
          <div className="reveal">
            <ul className="chips">
              <li>2D PLATFORMER</li>
              <li>PIXEL ART</li>
              <li>STORY</li>
              <li>MOVING PLATFORMS</li>
              <li>LEVITATION ZONES</li>
              <li>DIALOGUES</li>
              <li>CHECKPOINTS</li>
            </ul>
            <div className="build">
              <div className="tape" />
              <h4>🚧 UNDER CONSTRUCTION</h4>
              <p>
                We are building the first worlds of Nova Boy: levels, enemies, characters and the whole story.
                You will be able to play it very soon.
              </p>
              <div className="bar">
                <i />
              </div>
              <div className="bar-l">
                <span>LOADING…</span>
                <span>WIP</span>
              </div>
            </div>
            <div className="nb-controls" aria-label="Controls">
              <span className="key">← →</span> run <span className="key">SPACE</span> jump{" "}
              <span className="key">CLICK</span> shoot
            </div>
          </div>
          <div className="poster reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/novaboy/poster.webp" alt="Nova Boy cover art: Nova on the edge of a cliff looking at a sun behind the clouds" />
            <span>COMING SOON</span>
          </div>
        </div>
      </div>
    </section>
  );
}
