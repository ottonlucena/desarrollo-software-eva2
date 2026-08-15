/**
 * Controlador de la configuración del salón.
 *
 * Las tres operaciones —crear, editar y poner en servicio o retirar— comprueban la sesión
 * antes de tocar nada, porque una acción se puede invocar sin pasar por la navegación que
 * filtra `proxy.ts`.
 */
'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminSession } from '@/lib/admin-session';
import { describeDomainError } from '@/lib/domain-error';
import { createTable, setTableActive, updateTable } from '@/services/table.service';
import { tableSchema } from '@/validation/admin';
import { validateFormData, type FieldErrors } from '@/validation/form';

export type TableFormState = {
  message?: string;
  notice?: string;
  fieldErrors?: FieldErrors;
};

/**
 * Vuelve a generar las pantallas que dependen de las mesas.
 *
 * Cambiar una mesa altera tanto el listado del panel como la disponibilidad que ve el
 * comensal, así que ambas deben dejar de servirse desde la memoria.
 */
function refreshTableViews(): void {
  revalidatePath('/admin/mesas');
  revalidatePath('/reservar');
}

export async function createTableAction(
  _previousState: TableFormState,
  formData: FormData,
): Promise<TableFormState> {
  await requireAdminSession();

  const validation = validateFormData(tableSchema, formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors };
  }

  const result = await createTable(validation.data);

  if (!result.ok) {
    return { message: describeDomainError(result.error) };
  }

  refreshTableViews();

  return { notice: `La mesa ${result.value.number} quedó registrada.` };
}

export async function updateTableAction(
  tableId: string,
  _previousState: TableFormState,
  formData: FormData,
): Promise<TableFormState> {
  await requireAdminSession();

  const validation = validateFormData(tableSchema, formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors };
  }

  const result = await updateTable(tableId, validation.data);

  if (!result.ok) {
    return { message: describeDomainError(result.error) };
  }

  refreshTableViews();

  return { notice: `La mesa ${result.value.number} quedó actualizada.` };
}

/**
 * Pone una mesa en servicio o la retira.
 *
 * Retirarla no cancela sus reservas futuras (R9): el cierre puede ser temporal y el personal
 * quizá prefiera reubicar a esos comensales. La pantalla avisa de ello.
 */
export async function setTableActiveAction(
  tableId: string,
  active: boolean,
  _previousState: TableFormState,
): Promise<TableFormState> {
  await requireAdminSession();

  const result = await setTableActive(tableId, active);

  if (!result.ok) {
    return { message: describeDomainError(result.error) };
  }

  refreshTableViews();

  return {
    notice: active
      ? `La mesa ${result.value.number} volvió al servicio.`
      : `La mesa ${result.value.number} quedó fuera de servicio. Sus reservas ya confirmadas se mantienen.`,
  };
}
