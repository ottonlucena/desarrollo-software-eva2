/**
 * Controlador del detalle de una reserva en el panel.
 *
 * Comprueba la sesión del personal antes de tocar nada: el filtro de `proxy.ts` redirige la
 * navegación, pero una acción se puede invocar directamente sin pasar por ella.
 */
'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminSession } from '@/lib/admin-session';
import { describeDomainError } from '@/lib/domain-error';
import {
  cancelReservationAsStaff,
  updateReservationAsStaff,
} from '@/services/reservation.service';
import { validateFormData, type FieldErrors } from '@/validation/form';
import { updateReservationSchema } from '@/validation/reservation';

export type StaffReservationState = {
  message?: string;
  notice?: string;
  fieldErrors?: FieldErrors;
};

/**
 * Datos que el personal puede cambiar.
 *
 * Se reutiliza el esquema del comensal quitándole el código y el correo: el personal no
 * necesita acreditarse con ellos, porque abrió la reserva desde el listado. Las reglas de
 * forma sobre fecha, turno, mesa y comensales son exactamente las mismas.
 */
const staffChangesSchema = updateReservationSchema.omit({ code: true, email: true });

export async function updateReservationAsStaffAction(
  reservationId: string,
  _previousState: StaffReservationState,
  formData: FormData,
): Promise<StaffReservationState> {
  await requireAdminSession();

  const validation = validateFormData(staffChangesSchema, formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors };
  }

  const result = await updateReservationAsStaff(reservationId, validation.data);

  if (!result.ok) {
    return { message: describeDomainError(result.error) };
  }

  /*
   * El listado quedó desactualizado tras el cambio. Se le pide a Next.js que lo vuelva a
   * generar, para que el personal no vea datos viejos al volver atrás.
   */
  revalidatePath('/admin/reservas');

  return { notice: 'La reserva quedó actualizada.' };
}

export async function cancelReservationAsStaffAction(
  reservationId: string,
  _previousState: StaffReservationState,
): Promise<StaffReservationState> {
  await requireAdminSession();

  const result = await cancelReservationAsStaff(reservationId);

  if (!result.ok) {
    return { message: describeDomainError(result.error) };
  }

  revalidatePath('/admin/reservas');

  return { notice: 'La reserva fue cancelada y la mesa quedó disponible.' };
}
