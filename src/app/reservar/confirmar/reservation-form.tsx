/**
 * Formulario con los datos de contacto del comensal.
 *
 * Es un componente de cliente porque necesita dos cosas que solo existen en el navegador:
 * mostrar los errores que devuelve el servidor sin perder lo ya escrito, y deshabilitar el
 * botón mientras la reserva se está creando —sin eso, un doble clic intenta reservar dos
 * veces—.
 *
 * El resto de la página sigue siendo servidor: aquí no hay ninguna consulta ni regla.
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Alert } from '@/components/alert';
import { Field } from '@/components/field';
import styles from '@/components/forms.module.css';
import { firstError } from '@/validation/form';

import { createReservationAction, type CreateReservationState } from './actions';

const INITIAL_STATE: CreateReservationState = {};

/**
 * El botón vive en su propio componente porque `useFormStatus` solo informa del envío si se
 * lee desde dentro del formulario, no desde el componente que lo declara.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? 'Confirmando…' : 'Confirmar reserva'}
    </button>
  );
}

type ReservationFormProps = {
  tableId: string;
  date: string;
  shift: string;
  partySize: number;
};

export function ReservationForm({ tableId, date, shift, partySize }: ReservationFormProps) {
  const [state, formAction] = useActionState(createReservationAction, INITIAL_STATE);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {/*
        Los datos de la visita viajan ocultos porque ya fueron elegidos en los pasos
        anteriores. El servidor los vuelve a validar igual: un campo oculto es tan editable
        como uno visible.
      */}
      <input type="hidden" name="tableId" value={tableId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="shift" value={shift} />
      <input type="hidden" name="partySize" value={partySize} />

      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <div className={styles.row}>
        <Field name="firstName" label="Nombre" error={firstError(state.fieldErrors, 'firstName')}>
          {(field) => <input {...field} type="text" autoComplete="given-name" maxLength={50} />}
        </Field>

        <Field name="lastName" label="Apellido" error={firstError(state.fieldErrors, 'lastName')}>
          {(field) => <input {...field} type="text" autoComplete="family-name" maxLength={50} />}
        </Field>
      </div>

      <Field
        name="email"
        label="Correo electrónico"
        hint="Lo necesitará, junto con su código, para modificar o cancelar la reserva."
        error={firstError(state.fieldErrors, 'email')}
      >
        {(field) => <input {...field} type="email" autoComplete="email" maxLength={120} />}
      </Field>

      <Field
        name="phone"
        label="Teléfono"
        optional
        hint="Por si necesitamos comunicarnos con usted el mismo día."
        error={firstError(state.fieldErrors, 'phone')}
      >
        {(field) => <input {...field} type="tel" autoComplete="tel" maxLength={15} />}
      </Field>

      <Field
        name="notes"
        label="Comentarios"
        optional
        hint="Alergias, celebraciones o si necesita silla para bebé."
        error={firstError(state.fieldErrors, 'notes')}
      >
        {(field) => <textarea {...field} className={styles.textarea} maxLength={280} />}
      </Field>

      <SubmitButton />
    </form>
  );
}
