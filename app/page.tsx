import type { Metadata } from "next";
import Link from "next/link";

// Portada pública de krisonroad.com: quién desarrolla las apps y dónde están
// sus páginas legales. La revisa Meta al verificar el negocio.
export const metadata: Metadata = {
  title: "Krisonroad — Apps móviles",
  description:
    "Krisonroad desarrolla las apps móviles Bloomu (Life Plus) y ParkFinder.",
};

const CSS = `
  :root{
    --paper:#F7F8FA;
    --ink:#101828;
    --ink-soft:#475467;
    --ink-faint:#8A94A6;
    --brand:#2F6FEB;
    --line:#E3E7EE;
    --card:#FFFFFF;
    --green:#4C8F00;
    --blue:#2F7BFF;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --paper:#0E1320;
      --ink:#EEF1F7;
      --ink-soft:#AEB8CC;
      --ink-faint:#717D95;
      --brand:#6E9BFF;
      --line:#242C3E;
      --card:#161D2E;
      --green:#4C8F00;
      --blue:#2F7BFF;
    }
  }
  *{box-sizing:border-box;}
  body{margin:0; background:var(--paper); color:var(--ink);
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.6;}
  a{color:var(--brand);}
  .kr{max-width:880px; margin-inline:auto; padding:48px 16px 72px;}
  .kr header{display:flex; align-items:center; gap:12px; padding-bottom:24px;
    border-bottom:1px solid var(--line); margin-bottom:40px;}
  .kr .mark{display:grid; place-items:center; width:40px; height:40px; border-radius:11px;
    background:var(--ink); color:var(--paper); font-weight:900; font-size:1.2rem;}
  .kr .name{font-weight:800; font-size:1.3rem; letter-spacing:-0.01em;}
  .kr h1{font-size:clamp(1.9rem,5vw,2.7rem); line-height:1.12; margin:0 0 14px; letter-spacing:-0.02em;
    text-wrap:balance;}
  .kr .dek{color:var(--ink-soft); font-size:1.08rem; max-width:60ch; margin:0 0 44px;}
  .kr h2{font-size:0.78rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-faint);
    margin:0 0 16px;}
  .kr .apps{display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px; margin-bottom:48px;}
  .kr .app{background:var(--card); border:1px solid var(--line); border-radius:16px; padding:22px;
    display:flex; flex-direction:column; gap:10px;}
  .kr .app-head{display:flex; align-items:center; gap:12px;}
  .kr .icon{display:grid; place-items:center; width:44px; height:44px; border-radius:12px;
    color:#fff; font-weight:900; font-size:1.2rem;}
  .kr .app h3{margin:0; font-size:1.15rem;}
  .kr .app .tag{margin:0; color:var(--ink-faint); font-size:0.85rem;}
  .kr .app p{margin:0; color:var(--ink-soft);}
  .kr .links{display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:auto; padding-top:8px; font-size:0.92rem;}
  .kr .contact{background:var(--card); border:1px solid var(--line); border-radius:16px; padding:22px;}
  .kr dl{display:grid; grid-template-columns:max-content 1fr; gap:8px 20px; margin:0;}
  .kr dt{color:var(--ink-faint); font-size:0.9rem;}
  .kr dd{margin:0;}
  @media (max-width:520px){ .kr dl{grid-template-columns:1fr; gap:2px;} .kr dd{margin-bottom:10px;} }
  .kr footer{margin-top:48px; padding-top:20px; border-top:1px solid var(--line);
    color:var(--ink-faint); font-size:0.85rem;}
`;

export default function Home() {
  const year = new Date().getFullYear();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="kr">
        <header>
          <span className="mark" aria-hidden="true">K</span>
          <span className="name">Krisonroad</span>
        </header>

        <main>
          <h1>Apps móviles hechas para el día a día</h1>
          <p className="dek">
            Krisonroad es el estudio de desarrollo de Kristian Emilio Barrios Bastidas, en Atenas (Grecia).
            Creamos y mantenemos estas apps para Android.
          </p>

          <h2>Nuestras apps</h2>
          <div className="apps">
            <article className="app">
              <div className="app-head">
                <span className="icon" style={{ background: "var(--green)" }} aria-hidden="true">B</span>
                <div>
                  <h3>Bloomu (Life Plus)</h3>
                  <p className="tag">Nutrición y bienestar</p>
                </div>
              </div>
              <p>
                Registra comidas, medidas y progreso físico, y conecta con especialistas en nutrición.
              </p>
              <div className="links">
                <Link href="/admin/iq">Política de privacidad</Link>
                <Link href="/admin/iq#eliminar-cuenta">Eliminar mi cuenta</Link>
              </div>
            </article>

            <article className="app">
              <div className="app-head">
                <span className="icon" style={{ background: "var(--blue)" }} aria-hidden="true">P</span>
                <div>
                  <h3>ParkFinder</h3>
                  <p className="tag">Estacionamiento</p>
                </div>
              </div>
              <p>
                Detecta dónde estacionas y avisa a otros conductores cuando liberas tu lugar.
              </p>
              <div className="links">
                <Link href="/parkfinder">Más información</Link>
                <Link href="/parkfinder/privacidad">Política de privacidad</Link>
                <Link href="/parkfinder/eliminar-datos">Eliminar mis datos</Link>
              </div>
            </article>
          </div>

          <h2>Contacto</h2>
          <div className="contact">
            <dl>
              <dt>Responsable</dt>
              <dd>Kristian Emilio Barrios Bastidas</dd>
              <dt>Dirección</dt>
              <dd>Epameinonda 5, 16121 Kaisariani, Atenas, Grecia</dd>
              <dt>Correo</dt>
              <dd>
                <a href="mailto:compipana1@gmail.com">compipana1@gmail.com</a>
              </dd>
            </dl>
          </div>
        </main>

        <footer>© {year} Krisonroad · Kristian Emilio Barrios Bastidas</footer>
      </div>
    </>
  );
}
