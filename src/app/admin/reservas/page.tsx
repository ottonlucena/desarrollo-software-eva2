/**
 * Listado de reservas: la pantalla que reemplaza al cuaderno del mesón.
 *
 * Por omisión muestra el día de hoy, que es lo que el personal necesita ver al llegar. Los
 * filtros viajan en la dirección para que una vista concreta —por ejemplo, las canceladas de
 * mañana— se pueda guardar como marcador o recargar sin volver a elegirla.
 */
import Link from 'next/link';

import { Alert } from '@/components/alert';
import formStyles from '@/components/forms.module.css';
import { ReservationStatus } from '@/generated/prisma/enums';
import { requireAdminSession } from '@/lib/admin-session';
import { describeDate, describeDateShort, toISODate, today } from '@/lib/dates';
import { shiftTime } from '@/lib/shifts';
import { describeZone } from '@/lib/zones';
import { listReservations } from '@/services/reservation.service';
import { reservationFilterSchema } from '@/validation/admin';
import { validateSearchParams } from '@/validation/form';

import styles from './page.module.css';

export default async function AdminReservationsPage(props: PageProps<'/admin/reservas'>) {
  await requireAdminSession();

  const params = await props.searchParams;

  /*
   * Sin parámetros en la dirección se muestra el día de hoy. Es la vista útil al abrir el
   * panel; ver todas las reservas de todas las fechas casi nunca es lo que se busca.
   */
  const rawDate = typeof params.fecha === 'string' ? params.fecha : toISODate(today());
  const rawStatus = typeof params.estado === 'string' ? params.estado : '';

  const filters = validateSearchParams(reservationFilterSchema, {
    date: rawDate,
    status: rawStatus,
  });

  const reservations = filters.valid ? await listReservations(filters.data) : [];
  const filteredDate = filters.valid ? filters.data.date : undefined;

  const confirmedCount = reservations.filter(
    (reservation) => reservation.status === ReservationStatus.CONFIRMED,
  ).length;
  const guestCount = reservations
    .filter((reservation) => reservation.status === ReservationStatus.CONFIRMED)
    .reduce((total, reservation) => total + reservation.partySize, 0);

  return (
    <div className={formStyles.pageWide}>
      <h1 className={formStyles.pageTitle}>Reservas</h1>
      <p className={formStyles.pageIntro}>
        {filteredDate === undefined
          ? 'Mostrando todas las fechas.'
          : `Mostrando el ${describeDate(filteredDate)}.`}
      </p>

      <form method="get" className={styles.filters}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="fecha">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={rawDate}
            className={formStyles.input}
          />
          <span className={formStyles.hint}>Deje el campo vacío para ver todas.</span>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="estado">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={rawStatus}
            className={formStyles.select}
          >
            <option value="">Todas</option>
            <option value={ReservationStatus.CONFIRMED}>Confirmadas</option>
            <option value={ReservationStatus.CANCELLED}>Canceladas</option>
          </select>
        </div>

        <button type="submit" className={formStyles.button}>
          Filtrar
        </button>

        <Link href="/admin/reservas" className={formStyles.buttonSecondary}>
          Hoy
        </Link>
      </form>

      <p className={styles.tally}>
        {confirmedCount === 0
          ? 'Sin reservas confirmadas para este filtro.'
          : `${confirmedCount} ${confirmedCount === 1 ? 'reserva confirmada' : 'reservas confirmadas'} · ${guestCount} ${guestCount === 1 ? 'comensal' : 'comensales'}.`}
      </p>

      {reservations.length === 0 ? (
        <Alert tone="info">
          No hay reservas que coincidan con el filtro. Pruebe con otra fecha o quite el filtro
          de estado.
        </Alert>
      ) : (
        /*
         * La tabla se desplaza dentro de su propio contenedor. La página nunca se desplaza
         * en horizontal, ni siquiera en la tableta del mesón.
         */
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className="visually-hidden">
              Reservas del restaurante, con su horario, mesa, comensal y estado.
            </caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Turno</th>
                <th scope="col">Mesa</th>
                <th scope="col">Comensal</th>
                <th scope="col">Personas</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => {
                const isCancelled = reservation.status === ReservationStatus.CANCELLED;

                return (
                  <tr key={reservation.id} className={isCancelled ? styles.rowCancelled : ''}>
                    <td>{describeDateShort(reservation.date)}</td>
                    <td>{shiftTime(reservation.shift)}</td>
                    <td>
                      N.º {reservation.table.number}
                      <span className={styles.secondary}>
                        {describeZone(reservation.table.zone)}
                      </span>
                    </td>
                    <td>
                      {reservation.customer.firstName} {reservation.customer.lastName}
                      <span className={styles.secondary}>{reservation.customer.email}</span>
                    </td>
                    <td>{reservation.partySize}</td>
                    <td>
                      {/* El estado se dice con palabras, no solo con color. */}
                      <span
                        className={isCancelled ? styles.badgeCancelled : styles.badgeConfirmed}
                      >
                        {isCancelled ? 'Cancelada' : 'Confirmada'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/reservas/${reservation.id}`} className={styles.rowLink}>
                        Abrir
                        <span className="visually-hidden">
                          {' '}
                          la reserva {reservation.code}
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
