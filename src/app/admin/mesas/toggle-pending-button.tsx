/**
 * Botón que informa mientras su formulario se está enviando.
 *
 * Es lo único de este control que necesita ejecutarse en el navegador. `useFormStatus` solo
 * conoce el envío si se lee desde dentro del formulario, así que vive en su propio
 * componente; el formulario y la acción quedan en el servidor.
 */
'use client';

import { useFormStatus } from 'react-dom';

import formStyles from '@/components/forms.module.css';

type TogglePendingButtonProps = {
  /** Estado actual de la mesa. Determina solo el texto del botón, nunca lo que se envía. */
  active: boolean;
  tableNumber: number;
};

export function TogglePendingButton({ active, tableNumber }: TogglePendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={active ? formStyles.buttonSecondary : formStyles.button}
      disabled={pending}
    >
      {pending ? 'Aplicando…' : active ? 'Retirar' : 'Reactivar'}
      {/* El botón se repite en cada fila: hay que decir a qué mesa afecta. */}
      <span className="visually-hidden"> la mesa {tableNumber}</span>
    </button>
  );
}
