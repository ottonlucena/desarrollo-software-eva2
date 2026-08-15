/**
 * Formularios de modificación y cancelación de una reserva, desde el panel.
 *
 * Recibe ya resueltas las mesas que puede elegir: la consulta la hizo el servidor al cargar
 * la página, así que aquí no hay ninguna decisión de negocio.
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Alert } from '@/components/alert';
import { Field } from '@/components/field';
import formStyles from '@/components/forms.module.css';
import type { Zone } from '@/generated/prisma/enums';
import { addDays, toISODate, today } from '@/lib/dates';
import { describeService, shiftsByService, shiftTime } from '@/lib/shifts';
import { describeZone } from '@/lib/zones';
import { firstError } from '@/validation/form';
import { MAX_DAYS_IN_ADVANCE, MAX_PARTY_SIZE } from '@/validation/reservation';

import {
  cancelReservationAsStaffAction,
  updateReservationAsStaffAction,
  type StaffReservationState,
} from './actions';
import styles from './page.module.css';

const INITIAL_STATE: StaffReservationState = {};

function SubmitButton({ label, busyLabel, variant }: {
  label: string;
  busyLabel: string;
  variant: 'primary' | 'danger';
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={variant === 'danger' ? formStyles.buttonDanger : formStyles.button}
      disabled={pending}
    >
      {pending ? busyLabel : label}
    </button>
  );
}

export type TableChoice = {
  id: string;
  number: number;
  capacity: number;
  zone: Zone;
};

type StaffReservationFormProps = {
  reservationId: string;
  date: string;
  shift: string;
  partySize: number;
  tableId: string;
  notes: string;
  isCancelled: boolean;
  tableChoices: TableChoice[];
};

export function StaffReservationForm({
  reservationId,
  date,
  shift,
  partySize,
  tableId,
  notes,
  isCancelled,
  tableChoices,
}: StaffReservationFormProps) {
  /*
   * `bind` fija el identificador de la reserva como primer argumento de la acción. Así no
   * viaja en un campo del formulario, donde se podría alterar para editar otra reserva.
   */
  const [updateState, updateAction] = useActionState(
    updateReservationAsStaffAction.bind(null, reservationId),
    INITIAL_STATE,
  );
  const [cancelState, cancelAction] = useActionState(
    cancelReservationAsStaffAction.bind(null, reservationId),
    INITIAL_STATE,
  );

  // Solo una de las dos operaciones puede haber sido la última; se muestra su resultado.
  const state = cancelState.message ?? cancelState.notice ? cancelState : updateState;

  /*
   * React reinicia los campos al terminar una acción, así que ante un rechazo el valor
   * inicial pasa a ser lo enviado: el personal no pierde los cambios que ya había hecho.
   */
  const submitted = updateState.values ?? {};

  if (isCancelled) {
    return (
      <>
        {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}
        <Alert tone="info">
          Esta reserva está cancelada y no admite cambios. Si el comensal desea volver, debe
          crearse una reserva nueva.
        </Alert>
      </>
    );
  }

  return (
    <>
      {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <h2 className={styles.sectionTitle}>Modificar</h2>

      <form action={updateAction} className={formStyles.form} noValidate>
        <div className={formStyles.row}>
          <Field name="date" label="Fecha" error={firstError(updateState.fieldErrors, 'date')}>
            {(field) => (
              <input
                {...field}
                type="date"
                defaultValue={submitted.date ?? date}
                min={toISODate(today())}
                max={toISODate(addDays(today(), MAX_DAYS_IN_ADVANCE))}
              />
            )}
          </Field>

          <Field name="shift" label="Turno" error={firstError(updateState.fieldErrors, 'shift')}>
            {(field) => (
              <select {...field} defaultValue={submitted.shift ?? shift}>
                {shiftsByService().map(({ service, shifts }) => (
                  <optgroup key={service} label={describeService(service)}>
                    {shifts.map((option) => (
                      <option key={option} value={option}>
                        {shiftTime(option)}
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
            error={firstError(updateState.fieldErrors, 'partySize')}
          >
            {(field) => (
              <select {...field} defaultValue={submitted.partySize ?? partySize}>
                {Array.from({ length: MAX_PARTY_SIZE }, (_, index) => index + 1).map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field
            name="tableId"
            label="Mesa"
            hint="Solo las mesas libres en ese turno, más la actual."
            error={firstError(updateState.fieldErrors, 'tableId')}
          >
            {(field) => (
              <select {...field} defaultValue={submitted.tableId ?? tableId}>
                {tableChoices.map((table) => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.number} · {describeZone(table.zone)} · hasta {table.capacity}
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
          error={firstError(updateState.fieldErrors, 'notes')}
        >
          {(field) => (
            <textarea
              {...field}
              className={formStyles.textarea}
              defaultValue={submitted.notes ?? notes}
              maxLength={280}
            />
          )}
        </Field>

        <SubmitButton label="Guardar cambios" busyLabel="Guardando…" variant="primary" />
      </form>

      <h2 className={styles.sectionTitle}>Cancelar</h2>
      <p className={styles.sectionText}>
        La mesa quedará disponible de inmediato para ese turno. La reserva se conserva en el
        historial, pero no podrá volver a activarse.
      </p>

      <form action={cancelAction} className={styles.cancelForm}>
        <SubmitButton label="Cancelar reserva" busyLabel="Cancelando…" variant="danger" />
      </form>
    </>
  );
}
