/**
 * Reglas de negocio de las reservas.
 *
 * Aquí se aplican las reglas R1, R2, R4, R5 y R7 documentadas en `docs/domain.md`. Este
 * archivo no sabe que existe HTTP ni cómo se ven las pantallas: recibe datos ya validados en
 * su forma y devuelve el resultado de la operación.
 *
 * Ninguna función lanza excepciones por causas previstas: los rechazos del negocio viajan
 * como `Result`, para que quien llama esté obligado a contemplarlos.
 */
import { ReservationStatus } from '@/generated/prisma/enums';
import type { Shift } from '@/generated/prisma/enums';
import type { DomainErrorCode } from '@/lib/domain-error';
import { DomainError } from '@/lib/domain-error';
import { generateReservationCode } from '@/lib/reservation-code';
import { failure, success, type Result } from '@/lib/result';
import { saveCustomer } from '@/repositories/customer.repository';
import {
  cancelReservation as cancelReservationRow,
  createReservation as createReservationRow,
  findReservationByCodeAndEmail,
  findReservationById,
  findReservations,
  isSlotTakenError,
  updateReservation as updateReservationRow,
  type ReservationFilters,
  type ReservationWithDetails,
} from '@/repositories/reservation.repository';
import { findTableById } from '@/repositories/table.repository';

export type ReservationResult = Result<ReservationWithDetails, DomainErrorCode>;

type BookingRequest = {
  tableId: string;
  date: Date;
  shift: Shift;
  partySize: number;
};

/**
 * Comprueba que la mesa elegida exista, esté en servicio y admita al grupo.
 *
 * Son las reglas R4 y R2. Se verifican aquí y no en el esquema de validación porque
 * dependen del estado de la base de datos: ningún esquema puede saber la capacidad de la
 * mesa 7.
 */
async function checkTableAccepts(
  request: BookingRequest,
): Promise<DomainErrorCode | null> {
  const table = await findTableById(request.tableId);

  if (table === null) {
    return DomainError.TABLE_NOT_FOUND;
  }

  if (!table.active) {
    return DomainError.TABLE_INACTIVE;
  }

  if (request.partySize > table.capacity) {
    return DomainError.PARTY_SIZE_EXCEEDS_CAPACITY;
  }

  return null;
}

/**
 * Crea una reserva y devuelve el registro con su código.
 *
 * Sobre la regla R1: la comprobación de que la mesa esté libre la hace la base de datos
 * mediante el índice único parcial. Este servicio no consulta antes si el turno está tomado,
 * porque entre esa consulta y la escritura otra persona podría confirmar la misma mesa. En
 * su lugar, intenta escribir y traduce el rechazo de la base a un mensaje comprensible.
 */
export async function createReservation(input: {
  tableId: string;
  date: Date;
  shift: Shift;
  partySize: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}): Promise<ReservationResult> {
  const tableProblem = await checkTableAccepts(input);

  if (tableProblem !== null) {
    return failure(tableProblem);
  }

  const customer = await saveCustomer({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
  });

  try {
    const reservation = await createReservationRow({
      code: generateReservationCode(),
      customerId: customer.id,
      tableId: input.tableId,
      date: input.date,
      shift: input.shift,
      partySize: input.partySize,
      notes: input.notes,
    });

    return success(reservation);
  } catch (error: unknown) {
    if (isSlotTakenError(error)) {
      return failure(DomainError.TABLE_ALREADY_BOOKED);
    }

    // Cualquier otro fallo es de infraestructura y no una respuesta del negocio: se propaga.
    throw error;
  }
}

/**
 * Recupera una reserva a partir del código y el correo de quien la hizo (R7).
 *
 * Un código inexistente y un correo que no corresponde devuelven el mismo error a propósito:
 * distinguirlos revelaría a un tercero qué códigos existen.
 */
export async function findReservation(
  code: string,
  email: string,
): Promise<ReservationResult> {
  const reservation = await findReservationByCodeAndEmail(code, email);

  if (reservation === null) {
    return failure(DomainError.RESERVATION_NOT_FOUND);
  }

  return success(reservation);
}

/** Cambios que se pueden aplicar a una reserva, vengan del comensal o del personal. */
export type ReservationChangeRequest = {
  tableId: string;
  date: Date;
  shift: Shift;
  partySize: number;
  notes?: string;
};

/**
 * Aplica cambios a una reserva ya identificada.
 *
 * Concentra las reglas comunes a los dos caminos que llegan aquí —el comensal con su código
 * y el personal desde el panel—, para que ambos no puedan divergir. Lo único que los
 * distingue es cómo se acredita quién pide el cambio, y eso ocurre antes de esta función.
 */
async function applyChanges(
  reservation: ReservationWithDetails,
  changes: ReservationChangeRequest,
): Promise<ReservationResult> {
  // R5: una reserva cancelada no admite cambios.
  if (reservation.status === ReservationStatus.CANCELLED) {
    return failure(DomainError.RESERVATION_ALREADY_CANCELLED);
  }

  const tableProblem = await checkTableAccepts(changes);

  if (tableProblem !== null) {
    return failure(tableProblem);
  }

  try {
    return success(await updateReservationRow(reservation.id, changes));
  } catch (error: unknown) {
    if (isSlotTakenError(error)) {
      return failure(DomainError.TABLE_ALREADY_BOOKED);
    }

    throw error;
  }
}

/** Modificación pedida por el comensal, que se acredita con su código y su correo. */
export async function updateReservation(
  input: ReservationChangeRequest & { code: string; email: string },
): Promise<ReservationResult> {
  const found = await findReservation(input.code, input.email);

  if (!found.ok) {
    return found;
  }

  return applyChanges(found.value, input);
}

/**
 * Cancela una reserva.
 *
 * La fila no se elimina: cambiar el estado conserva el historial del restaurante y, gracias
 * a que el índice único solo alcanza a las reservas confirmadas, libera la mesa de inmediato
 * para ese turno (R6).
 */
export async function cancelReservation(
  code: string,
  email: string,
): Promise<ReservationResult> {
  const found = await findReservation(code, email);

  if (!found.ok) {
    return found;
  }

  return cancelIfActive(found.value);
}

/** Cancela una reserva vigente. Rechaza las que ya estaban canceladas (R5). */
async function cancelIfActive(
  reservation: ReservationWithDetails,
): Promise<ReservationResult> {
  if (reservation.status === ReservationStatus.CANCELLED) {
    return failure(DomainError.RESERVATION_ALREADY_CANCELLED);
  }

  return success(await cancelReservationRow(reservation.id));
}

/* -------------------------------------------------------------------------
 * Operaciones del personal del restaurante.
 *
 * Se distinguen de las anteriores solo en cómo se identifica la reserva: el personal la
 * abre desde el listado del panel, así que la referencia por su identificador en lugar de
 * pedir el código y el correo del comensal. Las reglas que se aplican después son las
 * mismas, porque son las mismas funciones.
 * ------------------------------------------------------------------------- */

/** Listado del panel, acotado por fecha y estado. */
export function listReservations(
  filters: ReservationFilters,
): Promise<ReservationWithDetails[]> {
  return findReservations(filters);
}

export async function getReservation(id: string): Promise<ReservationResult> {
  const reservation = await findReservationById(id);

  if (reservation === null) {
    return failure(DomainError.RESERVATION_NOT_FOUND);
  }

  return success(reservation);
}

/** Modificación hecha por el personal desde el panel. */
export async function updateReservationAsStaff(
  id: string,
  changes: ReservationChangeRequest,
): Promise<ReservationResult> {
  const found = await getReservation(id);

  if (!found.ok) {
    return found;
  }

  return applyChanges(found.value, changes);
}

/** Cancelación hecha por el personal, normalmente porque el comensal llamó por teléfono. */
export async function cancelReservationAsStaff(id: string): Promise<ReservationResult> {
  const found = await getReservation(id);

  if (!found.ok) {
    return found;
  }

  return cancelIfActive(found.value);
}
