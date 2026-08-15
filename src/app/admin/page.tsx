/**
 * Entrada del panel.
 *
 * No tiene contenido propio: lleva a las reservas del día, que es lo que el personal
 * necesita ver al abrirlo. Una portada intermedia solo añadiría un clic a la tarea más
 * frecuente del turno.
 */
import { redirect } from 'next/navigation';

import { requireAdminSession } from '@/lib/admin-session';

export default async function AdminHomePage() {
  await requireAdminSession();
  redirect('/admin/reservas');
}
