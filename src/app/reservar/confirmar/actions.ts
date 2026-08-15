/**
 * Controlador de la creación de reservas.
 *
 * Su única responsabilidad es la del controlador en el patrón MVC: recibir lo que envió el
 * formulario, comprobar su forma, delegar la decisión en el servicio y elegir la respuesta.
 * No contiene ninguna regla de negocio y no habla con la base de datos.
 */
'use server';

import { redirect } from 'next/navigation';

import { describeDomainError } from '@/lib/domain-error';
import { createReservation } from '@/services/reservation.service';
import {
  readSubmittedValues,
  validateFormData,
  type FieldErrors,
  type SubmittedValues,
} from '@/validation/form';
import { createReservationSchema } from '@/validation/reservation';

/**
 * Estado que el formulario recibe de vuelta tras un intento fallido.
 *
 * Solo existe para el camino de error: cuando la reserva se crea, la respuesta es una
 * redirección y este estado nunca llega a mostrarse.
 */
export type CreateReservationState = {
  /** Mensaje general, cuando el rechazo no corresponde a un campo concreto. */
  message?: string;
  /** Mensajes por campo, que se muestran bajo cada uno.  */
  fieldErrors?: FieldErrors;
  /** Lo que la persona ya había escrito, para no hacerla teclearlo otra vez. */
  values?: SubmittedValues;
};

export async function createReservationAction(
  _previousState: CreateReservationState,
  formData: FormData,
): Promise<CreateReservationState> {
  const validation = validateFormData(createReservationSchema, formData);

  // En todo camino de rechazo se devuelve lo escrito junto con el motivo.
  const submitted = readSubmittedValues(formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors, values: submitted };
  }

  const result = await createReservation(validation.data);

  if (!result.ok) {
    return { message: describeDomainError(result.error), values: submitted };
  }

  /*
   * Se responde con una redirección y no dibujando aquí la confirmación, para que recargar
   * la página de destino no vuelva a enviar el formulario ni cree una segunda reserva.
   *
   * `redirect` interrumpe la ejecución lanzando una señal interna de Next.js, así que va
   * fuera de cualquier try/catch que pudiera capturarla por error.
   */
  redirect(`/reserva/confirmada?codigo=${encodeURIComponent(result.value.code)}`);
}
