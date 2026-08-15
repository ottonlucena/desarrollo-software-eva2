/**
 * Pantalla de último recurso cuando algo falla de forma inesperada.
 *
 * Existe para que ningún fallo deje la interfaz muda. Sin esta red, una acción que se
 * interrumpe —la base de datos que no responde, el servidor que se reinició mientras la
 * página estaba abierta— dejaba el botón en "Aplicando…" para siempre, sin decirle nada a
 * quien está esperando.
 *
 * No muestra detalles técnicos: quien usa la aplicación no puede hacer nada con ellos. El
 * detalle se registra en la consola del servidor, que es donde sirve.
 */
'use client';

import { useEffect } from 'react';

import { Alert } from '@/components/alert';
import styles from '@/components/forms.module.css';

type ErrorPageProps = {
  error: Error & { digest?: string };
  /** Vuelve a intentar dibujar la pantalla sin perder el sitio en el que se estaba. */
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Fallo no controlado:', error);
  }, [error]);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Algo no funcionó</h1>

      <Alert tone="error">
        No pudimos completar la operación. Vuelva a intentarlo; si el problema persiste,
        comuníquese con el restaurante.
      </Alert>

      <div className={styles.actions} style={{ marginTop: 'var(--space-8)' }}>
        <button type="button" className={styles.button} onClick={reset}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
