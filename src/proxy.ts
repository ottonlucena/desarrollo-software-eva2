/**
 * Filtro que se ejecuta antes de renderizar cualquier ruta del panel.
 *
 * Su único trabajo es redirigir cuanto antes a quien no traiga una sesión abierta, para que
 * no llegue a cargarse una pantalla que igualmente iba a rechazarse.
 *
 * **No es el control de acceso.** Aquí solo se comprueba que exista la galleta, sin
 * verificar su contenido: este archivo se ejecuta fuera del entorno de Node.js y no dispone
 * de las funciones criptográficas necesarias. La comprobación real la hace
 * `requireAdminSession()` dentro de cada página y de cada acción, que es donde de verdad
 * importa, porque una acción se puede invocar sin pasar por la navegación.
 *
 * En Next.js 16 este archivo se llama `proxy.ts`; antes era `middleware.ts`.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_COOKIE_NAME } from '@/lib/admin-session';

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(ADMIN_COOKIE_NAME);

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL('/admin/acceso', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Se excluye `/admin/acceso` de la comprobación: es la pantalla a la que se redirige, y
   * protegerla dejaría a la persona dando vueltas entre ella y sí misma.
   */
  matcher: ['/admin', '/admin/((?!acceso).*)'],
};
