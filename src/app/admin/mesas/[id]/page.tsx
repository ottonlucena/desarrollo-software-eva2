/**
 * Edición de una mesa del salón.
 *
 * Muestra además cuántas reservas confirmadas tiene comprometidas, porque es el dato que
 * explica por qué el sistema puede rechazar una reducción de capacidad.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Alert } from '@/components/alert';
import formStyles from '@/components/forms.module.css';
import { requireAdminSession } from '@/lib/admin-session';
import { findLargestConfirmedPartySize } from '@/repositories/table.repository';
import { getTable } from '@/services/table.service';

import { EditTableForm } from './edit-table-form';
import styles from './page.module.css';

export default async function AdminTableDetailPage(props: PageProps<'/admin/mesas/[id]'>) {
  await requireAdminSession();

  const { id } = await props.params;
  const found = await getTable(id);

  if (!found.ok) {
    notFound();
  }

  const table = found.value;
  const largestParty = await findLargestConfirmedPartySize(table.id);

  return (
    <div className={formStyles.page}>
      <p className={styles.backLink}>
        <Link href="/admin/mesas">Volver a las mesas</Link>
      </p>

      <h1 className={formStyles.pageTitle}>Mesa {table.number}</h1>
      <p className={formStyles.pageIntro}>
        Cambie la configuración de la mesa o retírela del servicio.
      </p>

      {largestParty > 0 ? (
        <Alert tone="info">
          Esta mesa tiene reservas confirmadas para grupos de hasta {largestParty} personas,
          así que no puede reducirse su capacidad por debajo de esa cifra.
        </Alert>
      ) : null}

      {table.active ? null : (
        <Alert tone="info">
          Esta mesa está fuera de servicio: no se ofrece a los comensales. Sus reservas ya
          confirmadas se mantienen y deben gestionarse una por una.
        </Alert>
      )}

      <EditTableForm
        tableId={table.id}
        values={{
          number: String(table.number),
          capacity: String(table.capacity),
          zone: table.zone,
          active: table.active,
        }}
      />
    </div>
  );
}
