/**
 * Pantalla de gestión de la reserva del comensal.
 *
 * Tiene dos momentos en la misma página: primero pide el código y el correo, y una vez
 * acreditada la persona muestra su reserva con las opciones de modificar y cancelar.
 *
 * Se hace en una sola página, y no navegando a otra, porque el código y el correo tendrían
 * que viajar en la dirección para sobrevivir al cambio de página. Quedarían en el historial
 * del navegador y en cualquier enlace compartido.
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Alert } from '@/components/alert';
import { Field } from '@/components/field';
import formStyles from '@/components/forms.module.css';
import { parseServiceDate, describeDate, toISODate, today, addDays } from '@/lib/dates';
import { describeService, describeShift, shiftsByService, shiftTime } from '@/lib/shifts';
import { describeZone } from '@/lib/zones';
import type { Shift, Zone } from '@/generated/prisma/enums';
import { firstError } from '@/validation/form';
import { MAX_DAYS_IN_ADVANCE, MAX_PARTY_SIZE } from '@/validation/reservation';

import {
  manageReservationAction,
  type ManageReservationState,
  type ReservationView,
} from './actions';
import { ManageIntent } from './intents';
import styles from './page.module.css';

const INITIAL_STATE: ManageReservationState = {};

function SubmitButton({ label, busyLabel, variant }: {
  label: string;
  busyLabel: string;
  variant: 'primary' | 'danger';
}) {
  const { pending } = useFormStatus();
  const className = variant === 'danger' ? formStyles.buttonDanger : formStyles.button;

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? busyLabel : label}
    </button>
  );
}

/** Ficha de la reserva: lo que la persona ve antes de decidir si cambia algo. */
function ReservationSummary({ reservation }: { reservation: ReservationView }) {
  const isCancelled = reservation.status === 'CANCELLED';
  const date = parseServiceDate(reservation.date);

  return (
    <dl className={styles.summary}>
      <div className={styles.summaryRow}>
        <dt className={styles.summaryLabel}>Estado</dt>
        <dd className={styles.summaryValue}>
          {/* El estado se dice con palabras además de con color. */}
          <span className={isCancelled ? styles.badgeCancelled : styles.badgeConfirmed}>
            {isCancelled ? 'Cancelada' : 'Confirmada'}
          </span>
        </dd>
      </div>
      <div className={styles.summaryRow}>
        <dt className={styles.summaryLabel}>Código</dt>
        <dd className={styles.summaryValue}>{reservation.code}</dd>
      </div>
      <div className={styles.summaryRow}>
        <dt className={styles.summaryLabel}>A nombre de</dt>
        <dd className={styles.summaryValue}>{reservation.customerName}</dd>
      </div>
      <div className={styles.summaryRow}>
        <dt className={styles.summaryLabel}>Fecha</dt>
        <dd className={styles.summaryValueDate}>
          {date === null ? reservation.date : describeDate(date)}
        </dd>
      </div>
      <div className={styles.summaryRow}>
        <dt className={styles.summaryLabel}>Horario</dt>
        <dd className={styles.summaryValue}>{describeShift(reservation.shift as Shift)}</dd>
      </div>
      <div className={styles.summaryRow}>
        <dt className={styles.summaryLabel}>Mesa</dt>
        <dd className={styles.summaryValue}>
          N.º {reservation.tableNumber} · {describeZone(reservation.tableZone as Zone)}
        </dd>
      </div>
      <div className={styles.summaryRow}>
        <dt className={styles.summaryLabel}>Personas</dt>
        <dd className={styles.summaryValue}>{reservation.partySize}</dd>
      </div>
      {reservation.notes === '' ? null : (
        <div className={styles.summaryRow}>
          <dt className={styles.summaryLabel}>Comentarios</dt>
          <dd className={styles.summaryValue}>{reservation.notes}</dd>
        </div>
      )}
    </dl>
  );
}

export function ManageReservation() {
  const [state, formAction] = useActionState(manageReservationAction, INITIAL_STATE);

  const reservation = state.reservation;
  const isCancelled = reservation?.status === 'CANCELLED';

  // Todavía no se ha acreditado a nadie: se pide el código y el correo.
  if (reservation === undefined) {
    return (
      <form action={formAction} className={formStyles.form} noValidate>
        <input type="hidden" name="intent" value={ManageIntent.FIND} />

        {state.message ? <Alert tone="error">{state.message}</Alert> : null}

        <Field
          name="code"
          label="Código de reserva"
          hint="Lo recibió al confirmar, con el formato SG-XXXXXX."
          error={firstError(state.fieldErrors, 'code')}
        >
          {(field) => <input {...field} type="text" autoComplete="off" maxLength={12} />}
        </Field>

        <Field
          name="email"
          label="Correo electrónico"
          hint="El mismo con el que hizo la reserva."
          error={firstError(state.fieldErrors, 'email')}
        >
          {(field) => <input {...field} type="email" autoComplete="email" maxLength={120} />}
        </Field>

        <SubmitButton label="Ver mi reserva" busyLabel="Buscando…" variant="primary" />
      </form>
    );
  }

  return (
    <>
      {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <ReservationSummary reservation={reservation} />

      {isCancelled ? (
        <Alert tone="info">
          Esta reserva está cancelada y no admite cambios. Si desea visitarnos, haga una
          reserva nueva.
        </Alert>
      ) : (
        <>
          <h2 className={styles.sectionTitle}>Modificar la reserva</h2>

          <form action={formAction} className={formStyles.form} noValidate>
            {/*
              El código y el correo viajan en cada envío: no hay sesión, así que la persona
              se vuelve a acreditar en cada operación.
            */}
            <input type="hidden" name="intent" value={ManageIntent.UPDATE} />
            <input type="hidden" name="code" value={reservation.code} />
            <input type="hidden" name="email" value={reservation.email} />

            <div className={formStyles.row}>
              <Field name="date" label="Fecha" error={firstError(state.fieldErrors, 'date')}>
                {(field) => (
                  <input
                    {...field}
                    type="date"
                    defaultValue={reservation.date}
                    min={toISODate(today())}
                    max={toISODate(addDays(today(), MAX_DAYS_IN_ADVANCE))}
                  />
                )}
              </Field>

              <Field name="shift" label="Horario" error={firstError(state.fieldErrors, 'shift')}>
                {(field) => (
                  <select {...field} defaultValue={reservation.shift}>
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
            </div>

            <div className={formStyles.row}>
              <Field
                name="partySize"
                label="Personas"
                error={firstError(state.fieldErrors, 'partySize')}
              >
                {(field) => (
                  <select {...field} defaultValue={reservation.partySize}>
                    {Array.from({ length: MAX_PARTY_SIZE }, (_, index) => index + 1).map(
                      (size) => (
                        <option key={size} value={size}>
                          {size === 1 ? '1 persona' : `${size} personas`}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </Field>

              <Field
                name="tableId"
                label="Mesa"
                hint="Solo aparecen las mesas libres en ese turno."
                error={firstError(state.fieldErrors, 'tableId')}
              >
                {(field) => (
                  <select {...field} defaultValue={reservation.tableId}>
                    {(state.tableOptions ?? []).map((table) => (
                      <option key={table.id} value={table.id}>
                        Mesa {table.number} · {describeZone(table.zone as Zone)} · hasta{' '}
                        {table.capacity}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>

            <Field
              name="notes"
              label="Comentarios"
              optional
              error={firstError(state.fieldErrors, 'notes')}
            >
              {(field) => (
                <textarea
                  {...field}
                  className={formStyles.textarea}
                  defaultValue={reservation.notes}
                  maxLength={280}
                />
              )}
            </Field>

            <SubmitButton label="Guardar cambios" busyLabel="Guardando…" variant="primary" />
          </form>

          <h2 className={styles.sectionTitle}>Cancelar la reserva</h2>
          <p className={styles.sectionText}>
            Al cancelar, su mesa queda disponible para otras personas. Esta acción no se puede
            deshacer.
          </p>

          <form action={formAction} className={styles.cancelForm}>
            <input type="hidden" name="intent" value={ManageIntent.CANCEL} />
            <input type="hidden" name="code" value={reservation.code} />
            <input type="hidden" name="email" value={reservation.email} />

            <SubmitButton label="Cancelar reserva" busyLabel="Cancelando…" variant="danger" />
          </form>
        </>
      )}
    </>
  );
}
