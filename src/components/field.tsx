/**
 * Campo de formulario con su etiqueta, su ayuda y su error.
 *
 * Existe para que las tres piezas queden siempre conectadas: la etiqueta apunta al campo, y
 * el campo declara qué texto lo describe y si es inválido. Escrito a mano en cada pantalla,
 * ese cableado se olvida y el formulario deja de ser usable con lector de pantalla.
 */
import styles from './forms.module.css';

type FieldProps = {
  /** Debe coincidir con el atributo `name` del control, que es lo que lee el servidor. */
  name: string;
  label: string;
  /** Texto de ayuda permanente bajo el campo. */
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (props: {
    id: string;
    name: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    className: string;
  }) => React.ReactNode;
};

export function Field({ name, label, hint, error, optional, children }: FieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  // Un campo puede tener ayuda y error a la vez; ambos se anuncian, en ese orden.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
        {optional ? <span className={styles.optional}> (opcional)</span> : null}
      </label>

      {children({
        id: name,
        name,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        className: error ? `${styles.input} ${styles.inputInvalid}` : styles.input,
      })}

      {hint ? (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      ) : null}

      {error ? (
        <span className={styles.fieldError} id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
