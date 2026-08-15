/**
 * Confirmación de la reserva recién creada.
 *
 * Muestra el código en grande porque es lo único que el comensal necesita conservar: no se
 * envía por correo, así que si no lo anota aquí, no podrá gestionar su reserva después.
 *
 * La página solo muestra el código, nunca los datos personales de la reserva. Verlos exige
 * además el correo, en la pantalla de gestión.
 */
import Link from 'next/link';

import formStyles from '@/components/forms.module.css';
import { Alert } from '@/components/alert';

import styles from './page.module.css';

export default async function ReservationConfirmedPage(
  props: PageProps<'/reserva/confirmada'>,
) {
  const params = await props.searchParams;
  const code = typeof params.codigo === 'string' ? params.codigo : '';

  if (code === '') {
    return (
      <div className={formStyles.page}>
        <h1 className={formStyles.pageTitle}>No encontramos esa confirmación</h1>
        <Alert tone="error">
          El enlace no incluye un código de reserva. Si ya tiene el suyo, consúltelo desde
          &quot;Mi reserva&quot;.
        </Alert>
        <p className={styles.links}>
          <Link href="/mi-reserva">Ir a mi reserva</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={formStyles.page}>
      <Alert tone="success">Su reserva quedó confirmada.</Alert>

      <h1 className={styles.title}>Guarde su código</h1>
      <p className={styles.intro}>
        Necesitará este código junto con su correo electrónico para consultar, modificar o
        cancelar la reserva. No se lo enviaremos por correo.
      </p>

      <p className={styles.code}>{code}</p>

      <p className={styles.intro}>
        Le esperamos en Avenida Providencia 1234. Si necesita cambiar algo, puede hacerlo
        usted mismo en cualquier momento.
      </p>

      <div className={formStyles.actions}>
        <Link href="/mi-reserva" className={formStyles.button}>
          Ver mi reserva
        </Link>
        <Link href="/" className={formStyles.buttonSecondary}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
