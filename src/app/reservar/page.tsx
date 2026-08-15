/**
 * Paso 1 de la reserva: buscar qué mesas hay disponibles.
 *
 * La búsqueda viaja en la dirección (`?fecha=...&turno=...&personas=...`) y el formulario se
 * envía por GET. Así el resultado se puede compartir, recargar y recorrer con el botón de
 * volver del navegador, que es lo que la gente hace de verdad al comparar horarios.
 *
 * Como cualquiera puede editar la barra de direcciones, esos parámetros se validan con el
 * mismo esquema que se usaría para un formulario.
 */
import Link from 'next/link';

import { Alert } from '@/components/alert';
import { Field } from '@/components/field';
import formStyles from '@/components/forms.module.css';
import { addDays, describeDate, toISODate, today } from '@/lib/dates';
import { describeService, shiftsByService, shiftTime } from '@/lib/shifts';
import { describeZone } from '@/lib/zones';
import { listAvailableTables } from '@/services/availability.service';
import {
  availabilitySearchSchema,
  MAX_DAYS_IN_ADVANCE,
  MAX_PARTY_SIZE,
} from '@/validation/reservation';
import { firstError, validateSearchParams } from '@/validation/form';

import styles from './page.module.css';

/**
 * Los parámetros viajan en español porque forman parte de lo que el comensal ve en la barra
 * de direcciones; el modelo interno sigue en inglés.
 */
const PARAM_NAMES = { date: 'fecha', shift: 'turno', partySize: 'personas' } as const;

export default async function SearchAvailabilityPage(props: PageProps<'/reservar'>) {
  const params = await props.searchParams;

  const search = validateSearchParams(availabilitySearchSchema, {
    date: params[PARAM_NAMES.date],
    shift: params[PARAM_NAMES.shift],
    partySize: params[PARAM_NAMES.partySize],
  });

  // Sin parámetros aún: es la primera visita, no un error que reprochar.
  const isFirstVisit = Object.keys(params).length === 0;
  const errors = isFirstVisit || search.valid ? undefined : search.fieldErrors;

  const availableTables = search.valid ? await listAvailableTables(search.data) : [];

  const selectedDate = search.valid ? toISODate(search.data.date) : '';
  const selectedShift = search.valid ? search.data.shift : '';
  const selectedPartySize = search.valid ? search.data.partySize : 2;

  return (
    <div className={formStyles.pageWide}>
      <h1 className={formStyles.pageTitle}>Reservar una mesa</h1>
      <p className={formStyles.pageIntro}>
        Indique cuándo desea visitarnos y cuántos serán. Le mostraremos las mesas disponibles
        en ese turno.
      </p>

      <form method="get" className={styles.searchForm}>
        <Field
          name={PARAM_NAMES.date}
          label="Fecha"
          error={firstError(errors, 'date')}
          hint={`Puede reservar hasta con ${MAX_DAYS_IN_ADVANCE} días de anticipación.`}
        >
          {(field) => (
            <input
              {...field}
              type="date"
              defaultValue={selectedDate}
              min={toISODate(today())}
              max={toISODate(addDays(today(), MAX_DAYS_IN_ADVANCE))}
              required
            />
          )}
        </Field>

        <Field name={PARAM_NAMES.shift} label="Horario" error={firstError(errors, 'shift')}>
          {(field) => (
            <select {...field} defaultValue={selectedShift} required>
              <option value="" disabled>
                Elija un horario
              </option>
              {shiftsByService().map(({ service, shifts }) => (
                <optgroup key={service} label={describeService(service)}>
                  {shifts.map((shift) => (
                    <option key={shift} value={shift}>
                      {shiftTime(shift)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </Field>

        <Field
          name={PARAM_NAMES.partySize}
          label="Personas"
          error={firstError(errors, 'partySize')}
        >
          {(field) => (
            <select {...field} defaultValue={selectedPartySize}>
              {Array.from({ length: MAX_PARTY_SIZE }, (_, index) => index + 1).map((size) => (
                <option key={size} value={size}>
                  {size === 1 ? '1 persona' : `${size} personas`}
                </option>
              ))}
            </select>
          )}
        </Field>

        <button type="submit" className={formStyles.button}>
          Buscar disponibilidad
        </button>
      </form>

      {search.valid ? (
        <section className={styles.results} aria-live="polite">
          <h2 className={styles.resultsTitle}>
            {describeDate(search.data.date)} · {shiftTime(search.data.shift)}
          </h2>

          {availableTables.length === 0 ? (
            <Alert tone="info">
              No quedan mesas para ese turno con esa cantidad de personas. Pruebe con otro
              horario o con otra fecha.
            </Alert>
          ) : (
            <>
              <p className={styles.resultsCount}>
                {availableTables.length === 1
                  ? 'Queda 1 mesa disponible.'
                  : `Quedan ${availableTables.length} mesas disponibles.`}
              </p>

              {/*
                Las mesas ocupadas no se muestran en gris: si no se pueden elegir, no ocupan
                espacio ni obligan a leerlas.
              */}
              <ul className={styles.tableGrid}>
                {availableTables.map((table) => (
                  <li key={table.id}>
                    <Link
                      href={{
                        pathname: '/reservar/confirmar',
                        query: {
                          mesa: table.id,
                          [PARAM_NAMES.date]: selectedDate,
                          [PARAM_NAMES.shift]: selectedShift,
                          [PARAM_NAMES.partySize]: selectedPartySize,
                        },
                      }}
                      className={styles.tableCard}
                    >
                      <span className={styles.tableNumber}>Mesa {table.number}</span>
                      <span className={styles.tableZone}>{describeZone(table.zone)}</span>
                      <span className={styles.tableCapacity}>
                        Hasta {table.capacity} personas
                      </span>
                      <span className={styles.tableAction}>Elegir esta mesa</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
