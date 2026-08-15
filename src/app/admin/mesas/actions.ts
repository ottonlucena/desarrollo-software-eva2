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
import {
  readSubmittedValues,
  validateFormData,
  type FieldErrors,
  type SubmittedValues,
} from '@/validation/form';

export type TableFormState = {
  message?: string;
  notice?: string;
  fieldErrors?: FieldErrors;
  /** Lo enviado, para que un rechazo no vacíe el formulario. */
  values?: SubmittedValues;
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
  const submitted = readSubmittedValues(formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors, values: submitted };
  }

  const result = await createTable(validation.data);

  if (!result.ok) {
    return { message: describeDomainError(result.error), values: submitted };
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
  const submitted = readSubmittedValues(formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors, values: submitted };
  }

  const result = await updateTable(tableId, validation.data);

  if (!result.ok) {
    return { message: describeDomainError(result.error), values: submitted };
  }

  refreshTableViews();

  return { notice: `La mesa ${result.value.number} quedó actualizada.` };
}

/**
 * Pone una mesa en servicio o la retira.
 *
 * Retirarla no cancela sus reservas futuras (R9): el cierre puede ser temporal y el personal
 * quizá prefiera reubicar a esos comensales.
 *
 * No devuelve estado a propósito. Al no devolver nada, el formulario que la invoca no
 * necesita conservar información en el navegador, y Next.js vuelve a dibujar la página con
 * los datos frescos en cuanto la acción termina. Antes esta acción devolvía un aviso, y para
 * mostrarlo el botón mantenía un estado propio que podía quedar desfasado del real: la fila
 * seguía diciendo "Retirar" aunque la mesa ya estuviera retirada.
 *
 * El estado deseado viaja como argumento y es absoluto, no una inversión del actual, así que
 * repetir la operación deja siempre el mismo resultado.
 */
export async function setTableActiveAction(tableId: string, active: boolean): Promise<void> {
  await requireAdminSession();

  /*
   * Que la mesa no exista solo puede ocurrir si la fila que se pulsó ya no está en la base.
   * No hay nada que avisar: basta con volver a dibujar el listado, donde ya no aparecerá.
   */
  await setTableActive(tableId, active);

  refreshTableViews();
}
