import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad de Spotbase",
  description: "Qué datos recopila Spotbase, para qué los usa y con quién los comparte.",
};

export default function SpotbasePrivacy() {
  return (
    <main>
      <h1>Política de Privacidad de Spotbase</h1>
      <p className="dek">
        Spotbase detecta dónde estacionas y avisa a otros conductores cuando liberas tu lugar. Esta
        página explica, sin letra chica, qué datos usamos, para qué y con quién los compartimos.
      </p>
      <p className="meta">Vigente desde: 3 de noviembre de 2026 · Aplica a: la app Spotbase (Android)</p>

      <section>
        <h2>1. Información que recopilamos</h2>

        <h3>Cuenta</h3>
        <ul>
          <li>
            Al entrar con <strong>Google</strong> o <strong>Facebook</strong> recibimos tu nombre, correo
            electrónico y foto de perfil. No recibimos tu contraseña.
          </li>
          <li>Un identificador público (por ejemplo, CM4587) que se crea al registrarte.</li>
        </ul>

        <h3>Ubicación (también en segundo plano)</h3>
        <ul>
          <li>
            La ubicación precisa del teléfono, incluso con la app cerrada, para detectar cuándo manejas,
            dónde estacionas y cuándo te vas de tu lugar.
          </li>
          <li>
            Estos datos se procesan <strong>en tu teléfono</strong>. Al servidor solo se envía la ubicación
            de los lugares que liberas (y de las paradas cortas), con su hora.
          </li>
        </ul>

        <h3>Actividad física</h3>
        <ul>
          <li>
            El sensor de actividad del teléfono (quieto, caminando, en vehículo), para saber si vas en un
            carro. Se usa solo en tu teléfono.
          </li>
        </ul>

        <h3>Bluetooth de tu carro</h3>
        <ul>
          <li>
            El nombre y la dirección del dispositivo Bluetooth de tu carro, que eliges en la app, y cuándo
            el teléfono se conecta o se desconecta de él. Se guarda y se usa{" "}
            <strong>solo en tu teléfono</strong>.
          </li>
        </ul>

        <h3>Datos técnicos</h3>
        <ul>
          <li>Un registro del teléfono (token) para que la detección pueda publicar lugares con la app cerrada.</li>
        </ul>
      </section>

      <section>
        <h2>2. Cómo usamos tu información</h2>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Dato</th>
                <th>Para qué lo usamos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ubicación y actividad</td>
                <td>Detectar dónde estacionas y cuándo liberas tu lugar.</td>
              </tr>
              <tr>
                <td>Bluetooth de tu carro</td>
                <td>Confirmar que vas en tu propio carro y no en otro vehículo.</td>
              </tr>
              <tr>
                <td>Lugares liberados</td>
                <td>Mostrarlos en el mapa a los conductores cercanos, durante un máximo de 5 horas.</td>
              </tr>
              <tr>
                <td>Nombre, foto e identificador público</td>
                <td>Mostrar quién liberó cada lugar en el mapa.</td>
              </tr>
              <tr>
                <td>Correo electrónico</td>
                <td>Identificar tu cuenta y responder tus solicitudes.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>No usamos tus datos para publicidad ni los vendemos.</p>
      </section>

      <section>
        <h2>3. Qué ven otros usuarios</h2>
        <p>
          Los lugares que liberas aparecen en el mapa con su ubicación, la hora y tu nombre, foto e
          identificador públicos. <strong>Nadie más ve dónde está tu carro</strong> ni tus recorridos.
        </p>
      </section>

      <section>
        <h2>4. Con quién la compartimos</h2>
        <p>Solo con los proveedores que necesitamos para que la app funcione:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — aloja nuestra base de datos y el inicio de sesión.
          </li>
          <li>
            <strong>Google</strong> — inicio de sesión con Google, mapas (Google Maps) y servicios de
            ubicación y actividad del teléfono.
          </li>
          <li>
            <strong>Meta (Facebook)</strong> — inicio de sesión con Facebook.
          </li>
        </ul>
        <div className="card">
          <p>
            Estos proveedores reciben solo la información mínima para prestar su servicio y se rigen por sus
            propias políticas de privacidad.
          </p>
        </div>
      </section>

      <section>
        <h2>5. Seguridad</h2>
        <p>
          La información viaja cifrada y el acceso a la base de datos está limitado por reglas de seguridad,
          de modo que cada usuario solo puede modificar sus propios datos. Ningún sistema es infalible, pero
          mantenemos estas protecciones actualizadas.
        </p>
      </section>

      <section>
        <h2>6. Retención y eliminación</h2>
        <p>
          Conservamos tu cuenta y los lugares que liberaste mientras tu cuenta esté activa. Los datos
          guardados solo en tu teléfono (ubicación de tu carro, Bluetooth, grabaciones de recorridos) se
          borran al desinstalar la app.
        </p>
        <p>
          Puedes pedir que eliminemos tu cuenta y todos tus datos en cualquier momento: mira{" "}
          <Link href="/spotbase/eliminar-datos">cómo eliminar tus datos</Link>.
        </p>
      </section>

      <section>
        <h2>7. Menores de edad</h2>
        <p>
          Spotbase está pensada para conductores y no está dirigida a menores de 18 años. Si crees que un
          menor nos dio datos personales, escríbenos para eliminarlos.
        </p>
      </section>

      <section>
        <h2>8. Tus derechos</h2>
        <ul>
          <li>Acceder a los datos que tenemos sobre ti.</li>
          <li>Corregir datos incorrectos.</li>
          <li>Pedir la eliminación de tu cuenta y tus datos.</li>
          <li>Retirar los permisos de ubicación, actividad o Bluetooth desde los ajustes del teléfono.</li>
        </ul>
      </section>

      <section>
        <h2>9. Cambios a esta política</h2>
        <p>
          Si cambiamos esta política de forma importante, te avisaremos en la app antes de que entre en
          vigor. La fecha de arriba siempre indica la versión vigente.
        </p>
      </section>

      <section>
        <h2>10. Contacto</h2>
        <div className="card">
          <p>
            Para preguntas sobre esta política o para ejercer tus derechos, escríbenos a{" "}
            <a href="mailto:kristianbarrios8@gmail.com">
              <strong>kristianbarrios8@gmail.com</strong>
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
