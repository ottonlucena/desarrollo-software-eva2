/**
 * Detalle de una reserva en el panel.
 *
 * Muestra la ficha completa —incluidos los datos de contacto, que el personal necesita para
 * llamar al comensal— y ofrece modificarla o cancelarla.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import formStyles from '@/components/forms.module.css';
import { ReservationStatus } from '@/generated/prisma/enums';
import { requireAdminSession } from '@/lib/admin-session';
import { describeDate, toISODate } from '@/lib/dates';
import { describeShift } from '@/lib/shifts';
import { describeZone } from '@/lib/zones';
import { listAvailableTablesForUpdate } from '@/services/availability.service';
import { getReservation } from '@/services/reservation.service';

import { StaffReservationForm } from './staff-reservation-form';
import styles from './page.module.css';

export default async function AdminReservationDetailPage(
  props: PageProps<'/admin/reservas/[id]'>,
) {
  await requireAdminSession();

  const { id } = await props.params;
  const found = await getReservation(id);

  // Un identificador que no corresponde a ninguna reserva es una dirección que no existe.
  if (!found.ok) {
    notFound();
  }

  const reservation = found.value;
  const isCancelled = reservation.status === ReservationStatus.CANCELLED;

  /*
   * Las mesas elegibles se resuelven en el servidor, incluyendo la que la reserva ya ocupa
   * para que conservarla sea posible. En una reserva cancelada no se ofrece ninguna.
   */
  const tableChoices = isCancelled
    ? []
    : await listAvailableTablesForUpdate(
        {
          date: reservation.date,
          shift: reservation.shift,
          partySize: reservation.partySize,
        },
        reservation.id,
      );

  return (
    <div className={formStyles.page}>
      <p className={styles.backLink}>
        <Link href="/admin/reservas">Volver al listado</Link>
      </p>

      <h1 className={formStyles.pageTitle}>Reserva {reservation.code}</h1>

      <dl className={styles.summary}>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Estado</dt>
          <dd className={styles.summaryValue}>
            <span className={isCancelled ? styles.badgeCancelled : styles.badgeConfirmed}>
              {isCancelled ? 'Cancelada' : 'Confirmada'}
            </span>
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Comensal</dt>
          <dd className={styles.summaryValue}>
            {reservation.customer.firstName} {reservation.customer.lastName}
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Correo</dt>
          <dd className={styles.summaryValue}>
            <a href={`mailto:${reservation.customer.email}`}>{reservation.customer.email}</a>
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Teléfono</dt>
          <dd className={styles.summaryValue}>
            {reservation.customer.phone === null ? (
              <span className={styles.absent}>No lo indicó</span>
            ) : (
              <a href={`tel:${reservation.customer.phone}`}>{reservation.customer.phone}</a>
            )}
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Fecha</dt>
          <dd className={styles.summaryValueDate}>{describeDate(reservation.date)}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Turno</dt>
          <dd className={styles.summaryValue}>{describeShift(reservation.shift)}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Mesa</dt>
          <dd className={styles.summaryValue}>
            N.º {reservation.table.number} · {describeZone(reservation.table.zone)}
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Personas</dt>
          <dd className={styles.summaryValue}>{reservation.partySize}</dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Comentarios</dt>
          <dd className={styles.summaryValue}>
            {reservation.notes === null ? (
              <span className={styles.absent}>Sin comentarios</span>
            ) : (
              reservation.notes
            )}
          </dd>
        </div>
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Reservada el</dt>
          <dd className={styles.summaryValue}>
            {reservation.createdAt.toLocaleString('es-CL')}
          </dd>
        </div>
      </dl>

      <StaffReservationForm
        reservationId={reservation.id}
        date={toISODate(reservation.date)}
        shift={reservation.shift}
        partySize={reservation.partySize}
        tableId={reservation.table.id}
        notes={reservation.notes ?? ''}
        isCancelled={isCancelled}
        tableChoices={tableChoices}
      />
    </div>
  );
}
