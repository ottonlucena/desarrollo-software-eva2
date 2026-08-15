/**
 * Acceso a datos de las reservas.
 *
 * Además de las operaciones de lectura y escritura, aquí vive la interpretación del error que
 * devuelve PostgreSQL cuando se viola el índice único de mesa, fecha y turno: traducirlo es
 * una tarea de acceso a datos, no de negocio.
 */
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { prisma } from '@/lib/prisma';
import type { Shift } from '@/generated/prisma/enums';
import { ReservationStatus } from '@/generated/prisma/enums';
import type { CustomerModel, ReservationModel, TableModel } from '@/generated/prisma/models';

/**
 * Reserva junto con el cliente y la mesa a la que pertenece.
 *
 * Se declara como un tipo propio porque es la forma en que la interfaz necesita siempre una
 * reserva: mostrar "mesa 4" y "Ana Soto" en lugar de dos identificadores.
 */
export type ReservationWithDetails = ReservationModel & {
  customer: CustomerModel;
  table: TableModel;
};

/**
 * Trae el cliente y la mesa en la misma consulta que la reserva.
 *
 * Sin este `include`, cada acceso a `reservation.table` dispararía una consulta adicional:
 * un listado de treinta reservas costaría sesenta y una consultas en vez de una.
 */
const WITH_DETAILS = { customer: true, table: true } as const;

export type NewReservation = {
  code: string;
  customerId: string;
  tableId: string;
  date: Date;
  shift: Shift;
  partySize: number;
  notes?: string;
};

/**
 * Código de PostgreSQL para "violación de restricción única", tal como lo expone Prisma.
 * Ocurre cuando dos personas confirman la misma mesa y turno en el mismo instante.
 */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/** Indica si un error corresponde a una mesa que otra persona acaba de tomar. */
export function isSlotTakenError(error: unknown): boolean {
  return (
    error instanceof PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_VIOLATION
  );
}

export function createReservation(data: NewReservation): Promise<ReservationWithDetails> {
  return prisma.reservation.create({
    data: {
      code: data.code,
      customerId: data.customerId,
      tableId: data.tableId,
      date: data.date,
      shift: data.shift,
      partySize: data.partySize,
      notes: data.notes ?? null,
    },
    include: WITH_DETAILS,
  });
}

/**
 * Busca una reserva por su código y el correo de quien la hizo.
 *
 * Exigir los dos datos es la regla R7: el código por sí solo permitiría que un tercero que lo
 * viera de casualidad accediera a los datos personales del comensal.
 */
export function findReservationByCodeAndEmail(
  code: string,
  email: string,
): Promise<ReservationWithDetails | null> {
  return prisma.reservation.findFirst({
    where: { code, customer: { email } },
    include: WITH_DETAILS,
  });
}

export type ReservationChanges = {
  tableId: string;
  date: Date;
  shift: Shift;
  partySize: number;
  notes?: string;
};

export function updateReservation(
  id: string,
  changes: ReservationChanges,
): Promise<ReservationWithDetails> {
  return prisma.reservation.update({
    where: { id },
    data: {
      tableId: changes.tableId,
      date: changes.date,
      shift: changes.shift,
      partySize: changes.partySize,
      notes: changes.notes ?? null,
    },
    include: WITH_DETAILS,
  });
}

export function cancelReservation(id: string): Promise<ReservationWithDetails> {
  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELLED },
    include: WITH_DETAILS,
  });
}
