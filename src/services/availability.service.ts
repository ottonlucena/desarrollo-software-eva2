/**
 * Consulta de disponibilidad: qué mesas puede tomar un grupo en una fecha y un turno.
 *
 * Vive separado del servicio de reservas porque responde a una pregunta distinta y cambia
 * por razones distintas: este cambia si cambia cómo se ofrecen las mesas, aquel si cambian
 * las reglas para reservarlas. Es el principio de responsabilidad única aplicado a la
 * frontera entre dos servicios.
 */
import type { Shift } from '@/generated/prisma/enums';
import type { TableModel } from '@/generated/prisma/models';
import {
  findAvailableTables,
  findAvailableTablesForUpdate,
} from '@/repositories/table.repository';

export type AvailabilityQuery = {
  date: Date;
  shift: Shift;
  partySize: number;
};

/** Mesas libres para una búsqueda nueva. */
export function listAvailableTables(query: AvailabilityQuery): Promise<TableModel[]> {
  return findAvailableTables(query.date, query.shift, query.partySize);
}

/**
 * Mesas libres al modificar una reserva existente.
 *
 * Incluye la mesa que la propia reserva ocupa: de lo contrario, quien solo quiere cambiar la
 * cantidad de comensales vería su mesa actual como ocupada por sí misma.
 */
export function listAvailableTablesForUpdate(
  query: AvailabilityQuery,
  reservationId: string,
): Promise<TableModel[]> {
  return findAvailableTablesForUpdate(
    query.date,
    query.shift,
    query.partySize,
    reservationId,
  );
}
