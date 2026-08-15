/**
 * Controlador de la gestión de una reserva por parte del comensal.
 *
 * Las tres operaciones —consultar, modificar y cancelar— comprueban siempre el código y el
 * correo. No se guarda ninguna sesión: cada envío vuelve a acreditar quién es la persona.
 *
 * Es más trabajo por petición, pero evita mantener sesiones para un caso en que la persona
 * entra una vez, cambia algo y se va.
 */
'use server';

import { describeDomainError } from '@/lib/domain-error';
import { toISODate } from '@/lib/dates';
import type { ReservationWithDetails } from '@/repositories/reservation.repository';
import { listAvailableTablesForUpdate } from '@/services/availability.service';
import {
  cancelReservation,
  findReservation,
  updateReservation,
} from '@/services/reservation.service';
import { validateFormData, type FieldErrors } from '@/validation/form';
import {
  reservationLookupSchema,
  updateReservationSchema,
} from '@/validation/reservation';

import { ManageIntent } from './intents';

/** Cómo se ve una reserva en pantalla: solo lo que la vista necesita mostrar. */
export type ReservationView = {
  code: string;
  status: 'CONFIRMED' | 'CANCELLED';
  customerName: string;
  email: string;
  date: string;
  shift: string;
  partySize: number;
  notes: string;
  tableId: string;
  tableNumber: number;
  tableCapacity: number;
  tableZone: string;
};

/** Mesa que la persona puede elegir al modificar su reserva. */
export type TableOption = {
  id: string;
  number: number;
  capacity: number;
  zone: string;
};

export type ManageReservationState = {
  message?: string;
  /** Confirmación de un cambio aplicado, para distinguirla de un error. */
  notice?: string;
  fieldErrors?: FieldErrors;
  reservation?: ReservationView;
  /** Mesas libres para la fecha y el turno que la reserva tiene ahora. */
  tableOptions?: TableOption[];
};

/** Traduce la reserva del modelo a lo que la vista muestra. */
function toView(reservation: ReservationWithDetails): ReservationView {
  return {
    code: reservation.code,
    status: reservation.status,
    customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
    email: reservation.customer.email,
    date: toISODate(reservation.date),
    shift: reservation.shift,
    partySize: reservation.partySize,
    notes: reservation.notes ?? '',
    tableId: reservation.table.id,
    tableNumber: reservation.table.number,
    tableCapacity: reservation.table.capacity,
    tableZone: reservation.table.zone,
  };
}

/**
 * Mesas que la persona puede elegir al modificar.
 *
 * Incluye la que ya ocupa: sin esa excepción, quien solo quiere cambiar la cantidad de
 * comensales vería su propia mesa marcada como ocupada por sí misma.
 */
async function listOptions(reservation: ReservationWithDetails): Promise<TableOption[]> {
  const tables = await listAvailableTablesForUpdate(
    {
      date: reservation.date,
      shift: reservation.shift,
      partySize: reservation.partySize,
    },
    reservation.id,
  );

  return tables.map((table) => ({
    id: table.id,
    number: table.number,
    capacity: table.capacity,
    zone: table.zone,
  }));
}

/** Punto de entrada único de la pantalla: reparte según lo que se haya pedido. */
export async function manageReservationAction(
  previousState: ManageReservationState,
  formData: FormData,
): Promise<ManageReservationState> {
  switch (formData.get('intent')) {
    case ManageIntent.UPDATE:
      return updateReservationAction(previousState, formData);
    case ManageIntent.CANCEL:
      return cancelReservationAction(previousState, formData);
    default:
      return findReservationAction(previousState, formData);
  }
}

/** Consulta: pide el código y el correo, y devuelve la reserva si ambos coinciden. */
async function findReservationAction(
  _previousState: ManageReservationState,
  formData: FormData,
): Promise<ManageReservationState> {
  const validation = validateFormData(reservationLookupSchema, formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors };
  }

  const result = await findReservation(validation.data.code, validation.data.email);

  if (!result.ok) {
    return { message: describeDomainError(result.error) };
  }

  return {
    reservation: toView(result.value),
    tableOptions: await listOptions(result.value),
  };
}

/** Modificación: aplica los cambios y devuelve la reserva ya actualizada. */
async function updateReservationAction(
  _previousState: ManageReservationState,
  formData: FormData,
): Promise<ManageReservationState> {
  const validation = validateFormData(updateReservationSchema, formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors };
  }

  const result = await updateReservation(validation.data);

  if (!result.ok) {
    /*
     * Ante un rechazo se vuelve a leer la reserva para seguir mostrándola: si la pantalla
     * quedara vacía, la persona tendría que escribir otra vez su código y su correo solo
     * porque eligió una mesa que acababa de ocuparse.
     */
    const current = await findReservation(validation.data.code, validation.data.email);

    return {
      message: describeDomainError(result.error),
      reservation: current.ok ? toView(current.value) : undefined,
      tableOptions: current.ok ? await listOptions(current.value) : undefined,
    };
  }

  return {
    notice: 'Su reserva quedó actualizada.',
    reservation: toView(result.value),
    tableOptions: await listOptions(result.value),
  };
}

/** Cancelación. */
async function cancelReservationAction(
  _previousState: ManageReservationState,
  formData: FormData,
): Promise<ManageReservationState> {
  const validation = validateFormData(reservationLookupSchema, formData);

  if (!validation.valid) {
    return { fieldErrors: validation.fieldErrors };
  }

  const result = await cancelReservation(validation.data.code, validation.data.email);

  if (!result.ok) {
    return { message: describeDomainError(result.error) };
  }

  return {
    notice: 'Su reserva fue cancelada y la mesa quedó disponible para otras personas.',
    reservation: toView(result.value),
  };
}
