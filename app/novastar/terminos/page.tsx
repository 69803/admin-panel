import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de uso de NOVASTAR",
  description: "Condiciones para descargar y jugar NOVASTAR.",
};

export default function NovastarTerms() {
  return (
    <main>
      <h1>Términos de uso de NOVASTAR</h1>
      <p className="dek">Las reglas básicas para descargar y jugar NOVASTAR.</p>
      <p className="meta">Vigentes desde: 16 de noviembre de 2026</p>

      <section>
        <h2>1. Uso del juego</h2>
        <p>
          Puedes descargar NOVASTAR desde Google Play y jugarlo gratis para tu uso personal. Al instalarlo y
          jugarlo aceptas estos términos.
        </p>
      </section>

      <section>
        <h2>2. Propiedad</h2>
        <p>
          El juego, sus personajes, gráficos, sonidos y código pertenecen a Krisonroad. No está permitido
          copiarlo, modificarlo, venderlo ni distribuirlo sin permiso.
        </p>
      </section>

      <section>
        <h2>3. Sin garantías</h2>
        <p>
          Ofrecemos NOVASTAR &quot;tal cual&quot;. Trabajamos para que funcione bien, pero puede tener errores y
          podemos cambiarlo, actualizarlo o retirarlo en cualquier momento.
        </p>
      </section>

      <section>
        <h2>4. Privacidad</h2>
        <p>
          NOVASTAR no recopila datos personales. Los detalles están en la{" "}
          <Link href="/novastar/privacidad">Política de Privacidad</Link>.
        </p>
      </section>

      <section>
        <h2>5. Cambios</h2>
        <p>
          Podemos actualizar estos términos; la fecha de arriba indica la versión vigente. Si sigues jugando
          después de un cambio, se entiende que lo aceptas.
        </p>
      </section>

      <section>
        <h2>6. Contacto</h2>
        <div className="card">
          <p>
            ¿Dudas? Escríbenos a{" "}
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
