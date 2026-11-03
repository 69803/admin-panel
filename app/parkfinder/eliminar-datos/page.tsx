import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminar tus datos de ParkFinder",
  description: "Cómo pedir que eliminemos tu cuenta de ParkFinder y todos tus datos.",
};

export default function ParkFinderDeleteData() {
  return (
    <main>
      <h1>Eliminar tu cuenta y tus datos</h1>
      <p className="dek">
        Puedes pedir en cualquier momento que eliminemos tu cuenta de ParkFinder y todos los datos
        asociados, hayas entrado con Google o con Facebook.
      </p>

      <section>
        <h2>Cómo pedirlo</h2>
        <ol>
          <li>
            Escríbenos a{" "}
            <a href="mailto:kristianbarrios8@gmail.com?subject=Eliminar%20cuenta%20ParkFinder">
              <strong>kristianbarrios8@gmail.com</strong>
            </a>{" "}
            desde el correo de tu cuenta de Google o Facebook.
          </li>
          <li>
            En el asunto escribe <strong>&quot;Eliminar cuenta ParkFinder&quot;</strong>. Si lo sabes, incluye
            tu identificador público (por ejemplo, CM4587), que aparece en la app en <em>Mi cuenta</em>.
          </li>
          <li>
            Verificamos la solicitud y eliminamos tus datos en un plazo máximo de <strong>30 días</strong>.
            Te avisamos por correo cuando esté hecho.
          </li>
        </ol>
      </section>

      <section>
        <h2>Qué se elimina</h2>
        <ul>
          <li>Tu cuenta: nombre, correo, foto e identificador público.</li>
          <li>Todos los lugares que liberaste y tus paradas registradas.</li>
          <li>Los registros de tus teléfonos (tokens).</li>
          <li>El vínculo con tu cuenta de Google o Facebook.</li>
        </ul>
      </section>

      <section>
        <h2>Datos guardados en tu teléfono</h2>
        <p>
          La ubicación de tu carro, el Bluetooth de tu carro y las grabaciones de recorridos se guardan solo en
          tu teléfono. Se borran al <strong>desinstalar la app</strong>.
        </p>
      </section>

      <section>
        <h2>Si entraste con Facebook</h2>
        <div className="card">
          <p>
            También puedes quitar el acceso de ParkFinder a tu cuenta desde Facebook:{" "}
            <em>Configuración y privacidad → Configuración → Apps y sitios web → ParkFinder → Eliminar</em>.
            Eso corta el acceso, pero para borrar tus datos de ParkFinder sigue los pasos de arriba.
          </p>
        </div>
      </section>
    </main>
  );
}
