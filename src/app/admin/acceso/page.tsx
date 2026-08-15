/**
 * Pantalla de acceso al panel del personal.
 *
 * Queda fuera del filtro de `proxy.ts`: si estuviera protegida, redirigiría a sí misma sin
 * fin. Quien ya tiene la sesión abierta entra directamente al listado.
 */
import { redirect } from 'next/navigation';

import formStyles from '@/components/forms.module.css';
import { hasAdminSession } from '@/lib/admin-session';

import { AccessForm } from './access-form';

export default async function AdminAccessPage() {
  if (await hasAdminSession()) {
    redirect('/admin/reservas');
  }

  return (
    <div className={formStyles.page}>
      <h1 className={formStyles.pageTitle}>Panel del restaurante</h1>
      <p className={formStyles.pageIntro}>
        Esta zona es para el personal de Restaurante pa’ que mi suegra. Indique la clave del local para
        continuar.
      </p>

      <AccessForm />
    </div>
  );
}
