/**
 * Paso 2 de la reserva: confirmar la mesa elegida con los datos del comensal.
 *
 * La página comprueba en el servidor que la combinación de mesa, fecha, turno y personas
 * siga siendo válida antes de mostrar el formulario. Alguien pudo llegar aquí con un enlace
 * antiguo, o la mesa pudo ocuparse mientras decidía.
 */
import Link from 'next/link';

import { Alert } from '@/components/alert';
import formStyles from '@/components/forms.module.css';
import { describeDate, toISODate } from '@/lib/dates';
import { describeShift } from '@/lib/shifts';
import { describeZone } from '@/lib/zones';
import { listAvailableTables } from '@/services/availability.service';
import { availabilitySearchSchema } from '@/validation/reservation';
import { validateSearchParams } from '@/validation/form';

import { ReservationForm } from './reservation-form';
import styles from './page.module.css';

export default async function ConfirmReservationPage(
  props: PageProps<'/reservar/confirmar'>,
) {
  const params = await props.searchParams;

  const search = validateSearchParams(availabilitySearchSchema, {
    date: params.fecha,
    shift: params.turno,
    partySize: params.personas,
  });

  const tableId = typeof params.mesa === 'string' ? params.mesa : '';

  if (!search.valid || tableId === '') {
    return (
      <div className={formStyles.page}>
        <h1 className={formStyles.pageTitle}>No pudimos preparar su reserva</h1>
        <Alert tone="error">
          Faltan datos de la búsqueda o no son válidos. Vuelva a buscar disponibilidad para
          elegir una mesa.
        </Alert>
        <p className={styles.backLink}>
          <Link href="/reservar">Volver a buscar disponibilidad</Link>
        </p>
      </div>
    );
  }

  /*
   * Se busca la mesa entre las que están disponibles, y no simplemente por su identificador:
   * así una mesa que ya fue tomada, o que quedó fuera de servicio, no llega a mostrarse como
   * elegible. Es la misma consulta que alimentó el listado anterior.
   */
  const availableTables = await listAvailableTables(search.data);
  const table = availableTables.find((candidate) => candidate.id === tableId);

  if (table === undefined) {
    return (
      <div className={formStyles.page}>
        <h1 className={formStyles.pageTitle}>Esa mesa ya no está disponible</h1>
        <Alert tone="info">
          Otra persona reservó esa mesa para el mismo turno, o la mesa salió de servicio.
          Vuelva a buscar para ver las que siguen libres.
        </Alert>
        <p className={styles.backLink}>
          <Link
            href={{
              pathname: '/reservar',
              query: {
                fecha: toISODate(search.data.date),
                turno: search.data.shift,
                personas: search.data.partySize,
              },
            }}
          >
            Ver las mesas disponibles
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={formStyles.page}>
      <h1 className={formStyles.pageTitle}>Confirmar su reserva</h1>
      <p className={formStyles.pageIntro}>
        Revise los datos de su visita y complete sus datos de contacto.
      </p>

      <dl className={styles.summary}>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Fecha</dt>
          <dd className={styles.summaryValue}>{describeDate(search.data.date)}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Horario</dt>
          <dd className={styles.summaryValue}>{describeShift(search.data.shift)}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Mesa</dt>
          <dd className={styles.summaryValue}>
            N.º {table.number} · {describeZone(table.zone)} · hasta {table.capacity} personas
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Personas</dt>
          <dd className={styles.summaryValue}>{search.data.partySize}</dd>
        </div>
      </dl>

      <p className={styles.changeLink}>
        <Link
          href={{
            pathname: '/reservar',
            query: {
              fecha: toISODate(search.data.date),
              turno: search.data.shift,
              personas: search.data.partySize,
            },
          }}
        >
          Cambiar la mesa o el horario
        </Link>
      </p>

      <ReservationForm
        tableId={table.id}
        date={toISODate(search.data.date)}
        shift={search.data.shift}
        partySize={search.data.partySize}
      />
    </div>
  );
}
