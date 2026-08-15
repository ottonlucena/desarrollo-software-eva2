/**
 * Alta de una mesa nueva.
 *
 * Se muestra plegado por omisión: registrar una mesa es algo que ocurre pocas veces, y lo
 * habitual al abrir esta pantalla es consultar el salón, no ampliarlo.
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Alert } from '@/components/alert';
import formStyles from '@/components/forms.module.css';
import { Zone } from '@/generated/prisma/enums';

import { createTableAction, type TableFormState } from './actions';
import { TableFields } from './table-fields';
import styles from './page.module.css';

const INITIAL_STATE: TableFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={formStyles.button} disabled={pending}>
      {pending ? 'Registrando…' : 'Registrar mesa'}
    </button>
  );
}

export function NewTableForm() {
  const [state, formAction] = useActionState(createTableAction, INITIAL_STATE);

  /*
   * Tras un rechazo, los campos vuelven a mostrar lo que se había escrito. Sin esto, quien
   * escribe un número de mesa ya en uso perdería también la capacidad y el sector.
   */
  const submitted = state.values;

  return (
    <details className={styles.disclosure}>
      <summary className={styles.disclosureSummary}>Registrar una mesa nueva</summary>

      <form action={formAction} className={formStyles.form} noValidate>
        {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}
        {state.message ? <Alert tone="error">{state.message}</Alert> : null}

        <TableFields
          values={{
            number: submitted?.number ?? '',
            capacity: submitted?.capacity ?? '',
            zone: submitted?.zone ?? Zone.MAIN_HALL,
            // Una casilla sin marcar no se envía, así que su ausencia significa "no marcada".
            active: submitted === undefined ? true : submitted.active === 'on',
          }}
          errors={state.fieldErrors}
          idPrefix="nueva-"
        />

        <SubmitButton />
      </form>
    </details>
  );
}
