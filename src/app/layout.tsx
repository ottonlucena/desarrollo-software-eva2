/**
 * Estructura común a todas las páginas: tipografías, encabezado y pie.
 *
 * El par tipográfico es el definido en `docs/design.md`: una serif de contraste alto para
 * los títulos, que es la voz del restaurante, y una sans-serif neutra para la interfaz, que
 * es la voz del sistema.
 */
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import Link from 'next/link';

import './globals.css';
import styles from './layout.module.css';

const serif = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
});

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sabor Gourmet · Reservas',
  description:
    'Reserve su mesa en Sabor Gourmet. Consulte la disponibilidad del día y confirme en línea.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            Sabor Gourmet
          </Link>
          <nav aria-label="Principal">
            <Link href="/mi-reserva" className={styles.navLink}>
              Mi reserva
            </Link>
          </nav>
        </header>

        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div>
              <p className={styles.footerTitle}>Sabor Gourmet</p>
              <p>Avenida Providencia 1234, Santiago</p>
              <p>+56 2 2345 6789</p>
            </div>
            <div>
              <p className={styles.footerTitle}>Horarios</p>
              <p>Almuerzo: 13:00 a 15:00</p>
              <p>Cena: 20:00 a 22:00</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
