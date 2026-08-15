/**
 * Aviso destacado: un error que impide continuar, una confirmación o una nota informativa.
 *
 * Cada variante lleva un símbolo además del color, porque el color no puede ser el único
 * portador del significado: quien no distingue el rojo del verde debe entender igual qué
 * está leyendo.
 */
import styles from './forms.module.css';

type AlertTone = 'error' | 'success' | 'info';

const TONE_STYLES: Record<AlertTone, string> = {
  error: styles.alertError,
  success: styles.alertSuccess,
  info: styles.alertInfo,
};

const TONE_MARKS: Record<AlertTone, string> = {
  error: '!',
  success: '✓',
  info: 'i',
};

/** Texto que los lectores de pantalla anuncian antes del mensaje. */
const TONE_LABELS: Record<AlertTone, string> = {
  error: 'Error:',
  success: 'Listo:',
  info: 'Información:',
};

type AlertProps = {
  tone: AlertTone;
  children: React.ReactNode;
};

export function Alert({ tone, children }: AlertProps) {
  return (
    <p
      className={TONE_STYLES[tone]}
      // `alert` hace que un lector de pantalla anuncie el mensaje apenas aparece, que es lo
      // que se necesita cuando el envío de un formulario fue rechazado.
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.alertMark} aria-hidden="true">
        {TONE_MARKS[tone]}
      </span>
      <span>
        <span className="visually-hidden">{TONE_LABELS[tone]} </span>
        {children}
      </span>
    </p>
  );
}
