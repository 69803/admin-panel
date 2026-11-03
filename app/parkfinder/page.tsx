import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ParkFinder",
  description: "ParkFinder: encuentra y comparte estacionamientos en tiempo real.",
};

export default function ParkFinderHome() {
  return (
    <main>
      <h1>Encuentra y comparte estacionamientos en tiempo real</h1>
      <p className="dek">
        ParkFinder detecta automáticamente dónde estacionas tu carro y, cuando te vas, avisa a los
        conductores cercanos que ese lugar quedó libre.
      </p>

      <section>
        <h2>Cómo funciona</h2>
        <ul>
          <li>
            <strong>Tu carro, siempre a mano:</strong> la app recuerda dónde lo dejaste.
          </li>
          <li>
            <strong>Lugares liberados:</strong> cuando sales manejando, tu lugar aparece en el mapa de los
            demás como disponible durante un tiempo limitado.
          </li>
          <li>
            <strong>Sin tocar nada:</strong> la detección usa la ubicación del teléfono, el sensor de
            actividad y el Bluetooth de tu carro.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cuenta</h2>
        <p>
          Para usar ParkFinder entras con tu cuenta de Google o de Facebook. En el mapa, los lugares que
          liberas muestran tu nombre y foto públicos.
        </p>
        <div className="card">
          <p>
            Lee nuestra <Link href="/parkfinder/privacidad">Política de Privacidad</Link> o aprende cómo{" "}
            <Link href="/parkfinder/eliminar-datos">eliminar tu cuenta y tus datos</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
