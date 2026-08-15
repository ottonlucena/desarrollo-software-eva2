/**
 * Botón que pone una mesa en servicio o la retira, desde el propio listado.
 *
 * Es la operación más frecuente del día a día —una mesa que se rompe, un sector que se
 * cierra por lluvia—, así que se resuelve sin salir de la pantalla.
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import formStyles from '@/components/forms.module.css';

import { setTableActiveAction, type TableFormState } from './actions';
import styles from './page.module.css';

const INITIAL_STATE: TableFormState = {};

function SubmitButton({ active, tableNumber }: { active: boolean; tableNumber: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={active ? formStyles.buttonSecondary : formStyles.button}
      disabled={pending}
    >
      {pending ? 'Aplicando…' : active ? 'Retirar' : 'Reactivar'}
      {/* El botón repetido por fila necesita decirle al lector de pantalla a qué mesa afecta. */}
      <span className="visually-hidden"> la mesa {tableNumber}</span>
    </button>
  );
}

type ToggleTableButtonProps = {
  tableId: string;
  tableNumber: number;
  active: boolean;
};

export function ToggleTableButton({ tableId, tableNumber, active }: ToggleTableButtonProps) {
  /*
   * Se fijan con `bind` la mesa y el estado deseado: así no viajan en campos del formulario,
   * donde podrían alterarse para retirar una mesa distinta de la que dice el botón.
   */
  const [state, formAction] = useActionState(
    setTableActiveAction.bind(null, tableId, !active),
    INITIAL_STATE,
  );

  return (
    <form action={formAction}>
      <SubmitButton active={active} tableNumber={tableNumber} />
      {state.message ? <p className={styles.rowError}>{state.message}</p> : null}
    </form>
  );
}
