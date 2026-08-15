/**
 * Edición de una mesa existente.
 *
 * Reutiliza los mismos campos que el alta, de modo que ambas pantallas piden lo mismo y una
 * corrección se aplica a las dos.
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Alert } from '@/components/alert';
import formStyles from '@/components/forms.module.css';

import { updateTableAction, type TableFormState } from '../actions';
import { TableFields, type TableValues } from '../table-fields';

const INITIAL_STATE: TableFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={formStyles.button} disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  );
}

type EditTableFormProps = {
  tableId: string;
  values: TableValues;
};

export function EditTableForm({ tableId, values }: EditTableFormProps) {
  // El identificador se fija con `bind`: no viaja en el formulario y no se puede sustituir.
  const [state, formAction] = useActionState(
    updateTableAction.bind(null, tableId),
    INITIAL_STATE,
  );

  /*
   * Ante un rechazo se muestran los valores enviados en lugar de los guardados, para que el
   * personal vea lo que intentó y pueda corregir solo el campo que falló.
   */
  const submitted = state.values;

  return (
    <form action={formAction} className={formStyles.form} noValidate>
      {state.notice ? <Alert tone="success">{state.notice}</Alert> : null}
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <TableFields
        values={{
          number: submitted?.number ?? values.number,
          capacity: submitted?.capacity ?? values.capacity,
          zone: submitted?.zone ?? values.zone,
          active: submitted === undefined ? values.active : submitted.active === 'on',
        }}
        errors={state.fieldErrors}
        idPrefix="mesa-"
      />

      <SubmitButton />
    </form>
  );
}
