/**
 * Página "Mi reserva": el comensal consulta, modifica o cancela su reserva.
 *
 * Toda la interacción vive en un componente de cliente, porque el estado de la pantalla
 * depende de lo que devuelva cada envío. Esta página solo aporta el encabezado.
 */
import formStyles from '@/components/forms.module.css';

import { ManageReservation } from './manage-reservation';

export default function MyReservationPage() {
  return (
    <div className={formStyles.page}>
      <h1 className={formStyles.pageTitle}>Mi reserva</h1>
      <p className={formStyles.pageIntro}>
        Indique el código que recibió al reservar y el correo con el que la hizo. Podrá
        modificarla o cancelarla.
      </p>

      <ManageReservation />
    </div>
  );
}
