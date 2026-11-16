import Link from "next/link";

// Páginas públicas de NOVASTAR (las pide Google Play): /novastar,
// /novastar/privacidad y /novastar/terminos.
const CSS = `
  :root{
    --paper:#F7F6FB;
    --ink:#120F24;
    --ink-soft:#463F66;
    --ink-faint:#7D7799;
    --accent:#E8731C;
    --accent-soft:#FDEBDC;
    --brand:#5B4BD6;
    --line:#E0DDEE;
    --card:#FFFFFF;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --paper:#0D0B1C;
      --ink:#F1EFFA;
      --ink-soft:#B9B2D8;
      --ink-faint:#7A7499;
      --accent:#FF9A3C;
      --accent-soft:#2B1A10;
      --brand:#9C8CFF;
      --line:#2A2550;
      --card:#17143A;
    }
  }
  *{box-sizing:border-box;}
  body{margin:0; background:var(--paper); color:var(--ink);
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; line-height:1.65;}
  a{color:var(--brand);}
  .ns{max-width:760px; margin-inline:auto; padding:40px 20px 80px;}
  .ns header{display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
    padding-bottom:20px; margin-bottom:32px; border-bottom:1px solid var(--line);}
  .ns .brand{display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--ink);
    font-weight:800; font-size:1.25rem; letter-spacing:0.04em;}
  .ns .brand img{border-radius:9px;}
  .ns nav{display:flex; gap:16px; flex-wrap:wrap; font-size:0.92rem;}
  .ns nav a{text-decoration:none; color:var(--ink-soft);}
  .ns nav a:hover{color:var(--brand);}
  .ns h1{font-size:clamp(1.9rem,4.5vw,2.5rem); line-height:1.15; margin:0 0 10px;}
  .ns .dek{color:var(--ink-soft); font-size:1.05rem; margin:0 0 8px;}
  .ns .meta{color:var(--ink-faint); font-size:0.85rem; margin:0 0 32px;}
  .ns section{padding-top:26px; margin-top:26px; border-top:1px solid var(--line);}
  .ns h2{font-size:1.35rem; margin:0 0 12px;}
  .ns h3{font-size:1rem; margin:20px 0 6px;}
  .ns p, .ns ul{max-width:68ch; margin:0 0 14px;}
  .ns li{margin-bottom:6px;}
  .ns li::marker{color:var(--accent);}
  .ns .card{background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 20px; margin:18px 0;}
  .ns .card p:last-child{margin-bottom:0;}
  .ns .hero{display:flex; gap:20px; align-items:center; flex-wrap:wrap; margin-bottom:8px;}
  .ns .hero img{border-radius:22px; box-shadow:0 10px 30px rgba(0,0,0,0.25);}
  .ns footer{margin-top:48px; padding-top:20px; border-top:1px solid var(--line); color:var(--ink-faint);
    font-size:0.85rem; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;}
`;

export default function NovastarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ns">
        <header>
          <Link href="/novastar" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/novastar-icon.png" alt="" width={34} height={34} />
            NOVASTAR
          </Link>
          <nav>
            <Link href="/novastar">Inicio</Link>
            <Link href="/novastar/privacidad">Privacidad</Link>
            <Link href="/novastar/terminos">Términos</Link>
          </nav>
        </header>
        {children}
        <footer>
          <span>NOVASTAR — un juego de Krisonroad</span>
          <span>
            Contacto: <a href="mailto:kristianbarrios8@gmail.com">kristianbarrios8@gmail.com</a>
          </span>
        </footer>
      </div>
    </>
  );
}
