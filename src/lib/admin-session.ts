/**
 * Control de acceso al panel de administración.
 *
 * El restaurante trabaja con una sola clave compartida, guardada en una variable de entorno.
 * Es deliberadamente simple y tiene límites conocidos, descritos en `docs/architecture.md`:
 * no distingue a un miembro del personal de otro y no permite revocar el acceso de una sola
 * persona. Cubre el uso real —un panel que se abre desde el mesón del local— y deja el
 * camino abierto a usuarios con roles.
 *
 * Lo que sí se cuida:
 *
 * - La clave **no** viaja a la galleta. Se guarda su huella, de modo que leer la galleta no
 *   revela la clave.
 * - La comparación es de tiempo constante. Una comparación normal se detiene en el primer
 *   carácter distinto, y esa diferencia de tiempo permite adivinar la clave carácter a
 *   carácter.
 * - La galleta es `httpOnly`, así que ningún script de la página puede leerla.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE_NAME = 'pa_que_mi_suegra_admin';

/** Ocho horas: cubre un turno completo sin dejar la sesión abierta indefinidamente. */
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

/** Huella de la clave configurada. Es lo que se guarda en la galleta y lo que se compara. */
function accessFingerprint(): string | null {
  const key = process.env.ADMIN_ACCESS_KEY;

  // Sin clave configurada no se concede acceso a nadie, en lugar de dejar el panel abierto.
  if (key === undefined || key === '') {
    return null;
  }

  return createHash('sha256').update(key).digest('hex');
}

/** Compara dos textos sin que el tiempo empleado revele en qué carácter se diferencian. */
function equalsInConstantTime(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);

  // `timingSafeEqual` exige longitudes iguales; distinta longitud ya es distinta clave.
  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  return timingSafeEqual(leftBytes, rightBytes);
}

/** Indica si la clave escrita coincide con la configurada. */
export function isValidAccessKey(candidate: string): boolean {
  const key = process.env.ADMIN_ACCESS_KEY;

  if (key === undefined || key === '') {
    return false;
  }

  return equalsInConstantTime(candidate, key);
}

/** Abre la sesión del personal guardando la huella de la clave. */
export async function startAdminSession(): Promise<void> {
  const fingerprint = accessFingerprint();

  if (fingerprint === null) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, fingerprint, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/** Indica si la petición actual trae una sesión válida del personal. */
export async function hasAdminSession(): Promise<boolean> {
  const fingerprint = accessFingerprint();

  if (fingerprint === null) {
    return false;
  }

  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;

  return token !== undefined && equalsInConstantTime(token, fingerprint);
}

/**
 * Exige una sesión válida y, si no la hay, lleva a la pantalla de acceso.
 *
 * Se llama al principio de cada página y de cada acción del panel. La comprobación previa
 * que hace `proxy.ts` sirve para redirigir cuanto antes, pero no sustituye a esta: una
 * acción se puede invocar directamente, sin pasar por la navegación.
 */
export async function requireAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) {
    redirect('/admin/acceso');
  }
}
