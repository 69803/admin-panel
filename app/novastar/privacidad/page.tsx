import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad de NOVASTAR",
  description: "NOVASTAR no recopila, no guarda y no comparte datos personales.",
};

export default function NovastarPrivacy() {
  return (
    <main>
      <h1>Política de Privacidad de NOVASTAR</h1>
      <p className="dek">
        NOVASTAR es un juego que se juega por completo en tu teléfono. Esta página explica, sin letra
        chica, qué pasa con tus datos: <strong>no recopilamos ninguno</strong>.
      </p>
      <p className="meta">Vigente desde: 16 de noviembre de 2026 · Aplica a: el juego NOVASTAR (Android)</p>

      <section>
        <h2>1. Información que recopilamos</h2>
        <p>
          <strong>Ninguna.</strong> NOVASTAR no te pide crear una cuenta ni iniciar sesión, y no recopila,
          guarda ni envía a ningún servidor información personal: ni tu nombre, ni tu correo, ni tu
          ubicación, ni tus contactos, fotos o archivos.
        </p>
        <ul>
          <li>El juego no solicita permisos especiales del teléfono (ubicación, cámara, micrófono, contactos…).</li>
          <li>No contiene publicidad ni herramientas de analítica o seguimiento.</li>
          <li>No incluye compras dentro de la app.</li>
        </ul>
      </section>

      <section>
        <h2>2. Datos de la partida</h2>
        <p>
          Lo que haces en el juego (por ejemplo, los recursos que recolectas o el arma que llevas) solo
          existe mientras juegas, en la memoria de tu teléfono. No se envía a ningún lugar.
        </p>
      </section>

      <section>
        <h2>3. Con quién la compartimos</h2>
        <p>Con nadie: como no recopilamos datos, no tenemos nada que compartir ni vender.</p>
        <div className="card">
          <p>
            <strong>Google Play</strong>, la tienda desde donde descargas el juego, puede recopilar datos
            técnicos por su cuenta (por ejemplo, informes de fallos o estadísticas de instalación) según su
            propia <a href="https://policies.google.com/privacy">política de privacidad</a>. Nosotros solo
            vemos esos informes de forma agregada y anónima.
          </p>
        </div>
      </section>

      <section>
        <h2>4. Seguridad</h2>
        <p>
          Al no recopilar ni enviar datos personales, no hay información tuya que pueda filtrarse desde
          nuestros sistemas.
        </p>
      </section>

      <section>
        <h2>5. Retención y eliminación</h2>
        <p>
          No guardamos datos tuyos, así que no hay nada que eliminar de nuestra parte. Si desinstalas el
          juego, todo lo relacionado con él desaparece de tu teléfono.
        </p>
      </section>

      <section>
        <h2>6. Menores de edad</h2>
        <p>
          NOVASTAR no recopila datos personales de nadie, incluidos menores de edad. El juego incluye
          combate con criaturas fantásticas; revisa la clasificación por edades que aparece en Google Play.
        </p>
      </section>

      <section>
        <h2>7. Cambios a esta política</h2>
        <p>
          Si en una versión futura el juego empezara a usar algún dato (por ejemplo, para guardar tu
          progreso en línea), actualizaremos esta página antes de que ocurra. La fecha de arriba siempre
          indica la versión vigente.
        </p>
      </section>

      <section>
        <h2>8. Contacto</h2>
        <div className="card">
          <p>
            Para cualquier pregunta sobre esta política, escríbenos a{" "}
            <a href="mailto:kristianbarrios8@gmail.com">
              <strong>kristianbarrios8@gmail.com</strong>
            </a>
            . También puedes leer los <Link href="/novastar/terminos">Términos de uso</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
