/**
 * Configuración del salón: qué mesas hay, de qué capacidad y cuáles están en servicio.
 *
 * Es la pantalla que sostiene a todas las demás: sin mesas registradas no existe
 * disponibilidad y el sistema no puede usarse.
 */
import Link from 'next/link';

import { Alert } from '@/components/alert';
import formStyles from '@/components/forms.module.css';
import { requireAdminSession } from '@/lib/admin-session';
import { describeZone } from '@/lib/zones';
import { listTables } from '@/services/table.service';

import { NewTableForm } from './new-table-form';
import { ToggleTableButton } from './toggle-table-button';
import styles from './page.module.css';

export default async function AdminTablesPage() {
  await requireAdminSession();

  const tables = await listTables();

  const activeCount = tables.filter((table) => table.active).length;
  const totalSeats = tables
    .filter((table) => table.active)
    .reduce((total, table) => total + table.capacity, 0);

  return (
    <div className={formStyles.pageWide}>
      <h1 className={formStyles.pageTitle}>Mesas</h1>
      <p className={formStyles.pageIntro}>
        {activeCount} de {tables.length} mesas en servicio · {totalSeats} plazas disponibles.
      </p>

      <NewTableForm />

      {tables.length === 0 ? (
        <Alert tone="info">
          Todavía no hay mesas registradas. Registre la primera para que los comensales puedan
          reservar.
        </Alert>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className="visually-hidden">
              Mesas del salón, con su capacidad, sector y estado.
            </caption>
            <thead>
              <tr>
                <th scope="col">Mesa</th>
                <th scope="col">Capacidad</th>
                <th scope="col">Sector</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.id} className={table.active ? '' : styles.rowInactive}>
                  <td className={styles.tableNumber}>N.º {table.number}</td>
                  <td>
                    {table.capacity} {table.capacity === 1 ? 'persona' : 'personas'}
                  </td>
                  <td>{describeZone(table.zone)}</td>
                  <td>
                    {/* Estado con palabra además de color. */}
                    <span className={table.active ? styles.badgeActive : styles.badgeInactive}>
                      {table.active ? 'En servicio' : 'Fuera de servicio'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/admin/mesas/${table.id}`} className={styles.rowLink}>
                        Editar
                        <span className="visually-hidden"> la mesa {table.number}</span>
                      </Link>
                      <ToggleTableButton
                        tableId={table.id}
                        tableNumber={table.number}
                        active={table.active}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
