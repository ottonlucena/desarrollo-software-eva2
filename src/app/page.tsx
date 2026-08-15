/**
 * Portada del restaurante.
 *
 * Tiene una sola acción principal —reservar—, tal como fija `docs/design.md`. Todo lo demás
 * es secundario: quien llega con hambre y el teléfono en la mano debe alcanzar el formulario
 * en un toque.
 */
import Link from 'next/link';

import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Cocina de autor · Santiago</p>
          <h1 className={styles.title}>Sabor Gourmet</h1>
          <p className={styles.subtitle}>
            Una carta breve que cambia con la temporada, en un salón pensado para conversar
            sin prisa.
          </p>
          <Link href="/reservar" className={styles.callToAction}>
            Reservar una mesa
          </Link>
        </div>
      </section>

      <section className={styles.details}>
        <article>
          <h2 className={styles.detailTitle}>Servicio por turnos</h2>
          <p className={styles.detailText}>
            Servimos almuerzo a las 13:00, 14:00 y 15:00, y cena a las 20:00, 21:00 y 22:00.
            Cada turno tiene el salón completo a su disposición.
          </p>
        </article>
        <article>
          <h2 className={styles.detailTitle}>Reserve en línea</h2>
          <p className={styles.detailText}>
            Consulte la disponibilidad real del día y confirme su mesa en menos de un minuto,
            a cualquier hora.
          </p>
        </article>
        <article>
          <h2 className={styles.detailTitle}>Cambie cuando lo necesite</h2>
          <p className={styles.detailText}>
            Con el código de su reserva y su correo puede modificarla o cancelarla usted
            mismo, sin llamar por teléfono.
          </p>
        </article>
      </section>
    </>
  );
}
