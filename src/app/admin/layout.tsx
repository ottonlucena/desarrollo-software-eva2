/**
 * Marco del panel del personal.
 *
 * La barra de secciones solo se dibuja cuando hay sesión abierta: en la pantalla de acceso
 * no tiene sentido ofrecer enlaces a lo que todavía no se puede ver.
 *
 * El panel es sobrio y denso a propósito. Es una herramienta de trabajo que se consulta
 * muchas veces al día, no una pantalla de presentación: prioriza el escaneo rápido por sobre
 * la fotografía.
 */
import Link from 'next/link';

import { hasAdminSession } from '@/lib/admin-session';

import { signOutAction } from './acceso/actions';
import styles from './layout.module.css';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const isSignedIn = await hasAdminSession();

  return (
    <div className={styles.panel}>
      {isSignedIn ? (
        <div className={styles.bar}>
          <nav className={styles.sections} aria-label="Secciones del panel">
            <Link href="/admin/reservas" className={styles.section}>
              Reservas
            </Link>
            <Link href="/admin/mesas" className={styles.section}>
              Mesas
            </Link>
          </nav>

          <form action={signOutAction}>
            <button type="submit" className={styles.signOut}>
              Salir
            </button>
          </form>
        </div>
      ) : null}

      {children}
    </div>
  );
}
