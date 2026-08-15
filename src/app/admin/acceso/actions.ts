/**
 * Controlador del acceso al panel.
 *
 * Comprueba la clave y abre la sesión del personal. No decide nada sobre el negocio: la
 * validez de la clave la determina `admin-session`.
 */
'use server';

import { redirect } from 'next/navigation';

import { endAdminSession, isValidAccessKey, startAdminSession } from '@/lib/admin-session';

export type AccessState = { message?: string };

export async function signInAction(
  _previousState: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const key = formData.get('accessKey');

  if (typeof key !== 'string' || key.trim() === '') {
    return { message: 'Indique la clave de acceso.' };
  }

  if (!isValidAccessKey(key)) {
    /*
     * El mensaje no distingue entre "no hay clave configurada" y "la clave es incorrecta".
     * Diferenciarlos le diría a quien prueba a ciegas si va por buen camino.
     */
    return { message: 'La clave no es correcta. Verifíquela e intente nuevamente.' };
  }

  await startAdminSession();
  redirect('/admin/reservas');
}

export async function signOutAction(): Promise<void> {
  await endAdminSession();
  redirect('/admin/acceso');
}
