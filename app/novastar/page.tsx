import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NOVASTAR",
  description: "NOVASTAR: un astronauta, un laboratorio abandonado y un bosque por explorar.",
};

export default function NovastarHome() {
  return (
    <main>
      <div className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/novastar-icon.png" alt="Ícono de NOVASTAR" width={96} height={96} />
        <div>
          <h1>Sobrevive a la oscuridad</h1>
          <p className="dek">
            Un astronauta despierta en un laboratorio abandonado lleno de criaturas. Esquívalas, consigue el
            único revólver y encuentra la salida hacia un bosque por explorar.
          </p>
        </div>
      </div>

      <section>
        <h2>Cómo se juega</h2>
        <ul>
          <li>
            <strong>Muévete con el joystick</strong> y dispara, recarga o esquiva con los botones de la
            derecha.
          </li>
          <li>
            <strong>Escapa del laboratorio:</strong> las criaturas te persiguen si te ven; las salas seguras
            te protegen.
          </li>
          <li>
            <strong>Explora el bosque:</strong> corta árboles, pica piedra y oro, y recoge comida y agua.
          </li>
        </ul>
      </section>

      <section>
        <h2>Tu privacidad</h2>
        <div className="card">
          <p>
            NOVASTAR no tiene cuentas ni recopila datos personales. Es gratis y muestra anuncios de Google
            AdMob (en Europa, solo con tu consentimiento). Lee la{" "}
            <Link href="/novastar/privacidad">Política de Privacidad</Link> y los{" "}
            <Link href="/novastar/terminos">Términos de uso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
