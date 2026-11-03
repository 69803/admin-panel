import Link from "next/link";

// Páginas públicas de ParkFinder (las piden Google y Meta para el inicio de
// sesión): /parkfinder, /parkfinder/privacidad y /parkfinder/eliminar-datos.
const CSS = `
  :root{
    --paper:#F6F8FC;
    --ink:#0B1630;
    --ink-soft:#3E4C6A;
    --ink-faint:#7A869F;
    --accent:#0B8A3E;
    --accent-soft:#E3F5EA;
    --brand:#2F7BFF;
    --line:#DDE3EE;
    --card:#FFFFFF;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --paper:#0B1630;
      --ink:#EEF2FA;
      --ink-soft:#A9BDD5;
      --ink-faint:#6E7F9E;
      --accent:#39FF6A;
      --accent-soft:#12301F;
      --brand:#5B9BFF;
      --line:#23365C;
      --card:#13234A;
    }
  }
  *{box-sizing:border-box;}
  body{margin:0; background:var(--paper); color:var(--ink);
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.65;}
  a{color:var(--brand);}
  .pf{max-width:760px; margin-inline:auto; padding:40px 20px 80px;}
  .pf header{display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
    padding-bottom:20px; margin-bottom:32px; border-bottom:1px solid var(--line);}
  .pf .brand{display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--ink);
    font-weight:800; font-size:1.25rem;}
  .pf .brand span.p{display:inline-grid; place-items:center; width:34px; height:34px; border-radius:10px;
    background:var(--brand); color:#fff; font-weight:900;}
  .pf nav{display:flex; gap:16px; flex-wrap:wrap; font-size:0.92rem;}
  .pf nav a{text-decoration:none; color:var(--ink-soft);}
  .pf nav a:hover{color:var(--brand);}
  .pf h1{font-size:clamp(1.9rem,4.5vw,2.5rem); line-height:1.15; margin:0 0 10px;}
  .pf .dek{color:var(--ink-soft); font-size:1.05rem; margin:0 0 8px;}
  .pf .meta{color:var(--ink-faint); font-size:0.85rem; margin:0 0 32px;}
  .pf section{padding-top:26px; margin-top:26px; border-top:1px solid var(--line);}
  .pf h2{font-size:1.35rem; margin:0 0 12px;}
  .pf h3{font-size:1rem; margin:20px 0 6px;}
  .pf p, .pf ul{max-width:68ch; margin:0 0 14px;}
  .pf li{margin-bottom:6px;}
  .pf li::marker{color:var(--accent);}
  .pf .card{background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 20px; margin:18px 0;}
  .pf .card p:last-child{margin-bottom:0;}
  .pf table{width:100%; border-collapse:collapse; font-size:0.93rem; margin:6px 0 18px;}
  .pf th, .pf td{text-align:left; padding:9px 10px; border-bottom:1px solid var(--line); vertical-align:top;}
  .pf th{font-size:0.75rem; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-faint);}
  .pf .table{overflow-x:auto;}
  .pf footer{margin-top:48px; padding-top:20px; border-top:1px solid var(--line); color:var(--ink-faint);
    font-size:0.85rem; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;}
`;

export default function ParkFinderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pf">
        <header>
          <Link href="/parkfinder" className="brand">
            <span className="p">P</span>ParkFinder
          </Link>
          <nav>
            <Link href="/parkfinder">Inicio</Link>
            <Link href="/parkfinder/privacidad">Privacidad</Link>
            <Link href="/parkfinder/eliminar-datos">Eliminar mis datos</Link>
          </nav>
        </header>
        {children}
        <footer>
          <span>ParkFinder — encuentra y comparte estacionamientos</span>
          <span>
            Contacto: <a href="mailto:kristianbarrios8@gmail.com">kristianbarrios8@gmail.com</a>
          </span>
        </footer>
      </div>
    </>
  );
}
