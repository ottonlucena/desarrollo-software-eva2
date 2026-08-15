/**
 * Formulario de acceso al panel.
 *
 * Es un componente de cliente para poder mostrar el rechazo sin recargar y deshabilitar el
 * botón mientras se comprueba la clave.
 */
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Alert } from '@/components/alert';
import { Field } from '@/components/field';
import styles from '@/components/forms.module.css';

import { signInAction, type AccessState } from './actions';

const INITIAL_STATE: AccessState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? 'Comprobando…' : 'Entrar'}
    </button>
  );
}

export function AccessForm() {
  const [state, formAction] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <Field name="accessKey" label="Clave de acceso">
        {(field) => (
          <input
            {...field}
            type="password"
            // El navegador no debe ofrecer guardarla: es una clave compartida del local.
            autoComplete="off"
            autoFocus
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}
