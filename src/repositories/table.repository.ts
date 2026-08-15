/**
 * Acceso a datos de las mesas.
 *
 * Este archivo solo lee y escribe: no decide nada. Cualquier regla sobre qué mesa puede
 * reservarse vive en los servicios.
 */
import { prisma } from '@/lib/prisma';
import type { Shift } from '@/generated/prisma/enums';
import { ReservationStatus } from '@/generated/prisma/enums';
import type { TableModel } from '@/generated/prisma/models';

/** Mesas en servicio, ordenadas por número tal como las conoce el personal. */
export function findActiveTables(): Promise<TableModel[]> {
  return prisma.table.findMany({
    where: { active: true },
    orderBy: { number: 'asc' },
  });
}

export function findTableById(id: string): Promise<TableModel | null> {
  return prisma.table.findUnique({ where: { id } });
}

/**
 * Mesas libres para una fecha, un turno y un tamaño de grupo.
 *
 * La consulta responde a las tres condiciones de disponibilidad descritas en
 * `docs/domain.md`: la mesa está en servicio, admite al grupo, y no tiene ninguna reserva
 * confirmada en ese turno.
 *
 * La tercera condición se resuelve con un `none` sobre la relación, que Prisma traduce a una
 * única consulta con subconsulta. La alternativa —traer todas las mesas y preguntar por cada
 * una si está ocupada— provocaría una consulta por mesa (el problema de las N+1).
 *
 * El resultado se ordena por capacidad ascendente para ofrecer primero la mesa más ajustada
 * al grupo y no malgastar una mesa de ocho personas en una pareja.
 */
export function findAvailableTables(
  date: Date,
  shift: Shift,
  partySize: number,
): Promise<TableModel[]> {
  return prisma.table.findMany({
    where: {
      active: true,
      capacity: { gte: partySize },
      reservations: {
        none: { date, shift, status: ReservationStatus.CONFIRMED },
      },
    },
    orderBy: [{ capacity: 'asc' }, { number: 'asc' }],
  });
}

/**
 * Igual que `findAvailableTables`, pero además conserva la mesa que ya ocupa una reserva.
 *
 * Se usa al modificar: sin esta excepción, la propia reserva que se está editando aparecería
 * ocupando su mesa y la persona no podría conservarla mientras cambia, por ejemplo, la
 * cantidad de comensales.
 */
export function findAvailableTablesForUpdate(
  date: Date,
  shift: Shift,
  partySize: number,
  reservationIdToIgnore: string,
): Promise<TableModel[]> {
  return prisma.table.findMany({
    where: {
      active: true,
      capacity: { gte: partySize },
      reservations: {
        none: {
          date,
          shift,
          status: ReservationStatus.CONFIRMED,
          id: { not: reservationIdToIgnore },
        },
      },
    },
    orderBy: [{ capacity: 'asc' }, { number: 'asc' }],
  });
}
