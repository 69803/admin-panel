import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad de NOVASTAR",
  description:
    "NOVASTAR no tiene cuentas ni guarda datos personales. Muestra anuncios de Google AdMob, con tu consentimiento en Europa.",
};

export default function NovastarPrivacy() {
  return (
    <main>
      <h1>Política de Privacidad de NOVASTAR</h1>
      <p className="dek">
        NOVASTAR es un juego que se juega por completo en tu teléfono. Esta página explica, sin letra
        chica, qué pasa con tus datos: <strong>nosotros no recopilamos ninguno</strong>, pero el juego
        muestra anuncios de Google AdMob, y Google trata algunos datos para mostrarlos.
      </p>
      <p className="meta">Vigente desde: 20 de noviembre de 2026 · Aplica a: el juego NOVASTAR (Android)</p>

      <section>
        <h2>1. Información que recopilamos nosotros</h2>
        <p>
          <strong>Ninguna.</strong> NOVASTAR no te pide crear una cuenta ni iniciar sesión, y nosotros no
          recopilamos, guardamos ni recibimos información personal: ni tu nombre, ni tu correo, ni tu
          ubicación, ni tus contactos, fotos o archivos.
        </p>
        <ul>
          <li>El juego no solicita permisos especiales del teléfono (ubicación, cámara, micrófono, contactos…).</li>
          <li>Muestra anuncios de Google AdMob (ver el punto 3).</li>
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
        <h2>3. Publicidad (Google AdMob)</h2>
        <p>
          El juego es gratuito y muestra anuncios mediante <strong>Google AdMob</strong>, un servicio de
          Google Ireland Limited / Google LLC. Para mostrar los anuncios, medir su rendimiento y evitar el
          fraude, Google puede recoger y tratar:
        </p>
        <ul>
          <li>el identificador de publicidad de tu dispositivo,</li>
          <li>la dirección IP y una ubicación aproximada que se deduce de ella,</li>
          <li>información técnica del dispositivo (modelo, sistema, idioma),</li>
          <li>tus interacciones con los anuncios (impresiones y clics).</li>
        </ul>
        <p>
          <strong>Si estás en el Espacio Económico Europeo, el Reino Unido o Suiza</strong>, antes de mostrar
          anuncios el juego te pide tu consentimiento con el formulario de Google. Puedes aceptar,
          rechazar o elegir tus opciones, y cambiar tu decisión más tarde desde las opciones de privacidad
          del juego. Si no das tu consentimiento puedes seguir jugando igual; en su caso verás anuncios no
          personalizados.
        </p>
        <p>
          <strong>Anuncios con recompensa:</strong> algunos anuncios son opcionales. Solo si decides verlos
          enteros recibes una recompensa en el juego (por ejemplo, recuperar un corazón). Verlos es siempre
          voluntario.
        </p>
        <div className="card">
          <p>
            Más información sobre cómo usa Google los datos:{" "}
            <a href="https://policies.google.com/technologies/partner-sites">
              policies.google.com/technologies/partner-sites
            </a>{" "}
            y su <a href="https://policies.google.com/privacy">política de privacidad</a>. También puedes
            restablecer o desactivar el identificador de publicidad en los ajustes de tu teléfono.
          </p>
        </div>
      </section>

      <section>
        <h2>4. Con quién compartimos datos</h2>
        <p>
          Nosotros no recopilamos datos, así que no tenemos nada que compartir ni vender. Los datos de
          publicidad los trata directamente Google (punto 3).
        </p>
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
        <h2>5. Base legal (RGPD)</h2>
        <p>
          Los anuncios personalizados se basan en tu consentimiento (art. 6.1.a del RGPD). La medición de
          los anuncios y la prevención del fraude se basan en el interés legítimo de ofrecer el juego
          gratis y de forma segura (art. 6.1.f del RGPD).
        </p>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>
          Tienes derecho a acceder a tus datos, rectificarlos, suprimirlos, limitar u oponerte a su
          tratamiento, a la portabilidad y a retirar tu consentimiento en cualquier momento. Como nosotros
          no guardamos datos personales, las solicitudes sobre los datos de publicidad las gestiona Google.
          Puedes reclamar ante la Autoridad Helénica de Protección de Datos (
          <a href="https://www.dpa.gr">www.dpa.gr</a>) o la autoridad de tu país.
        </p>
      </section>

      <section>
        <h2>7. Seguridad, retención y eliminación</h2>
        <p>
          No guardamos datos tuyos en nuestros sistemas, así que no hay nada que pueda filtrarse ni que
          eliminar de nuestra parte. Si desinstalas el juego, todo lo relacionado con él desaparece de tu
          teléfono.
        </p>
      </section>

      <section>
        <h2>8. Menores de edad</h2>
        <p>
          NOVASTAR no está dirigido a menores de 13 años y no recopilamos a sabiendas datos de menores. El
          juego incluye combate con criaturas fantásticas; revisa la clasificación por edades que aparece
          en Google Play.
        </p>
      </section>

      <section>
        <h2>9. Cambios a esta política</h2>
        <p>
          Si el juego empezara a usar otros datos (por ejemplo, para guardar tu progreso en línea),
          actualizaremos esta página antes de que ocurra. La fecha de arriba siempre indica la versión
          vigente.
        </p>
      </section>

      <section>
        <h2>10. Contacto</h2>
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
