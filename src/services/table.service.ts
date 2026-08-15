/**
 * Reglas de negocio de la configuración del salón.
 *
 * Las mesas son el recurso que administra el personal: cuántas hay, de qué capacidad, en qué
 * sector, y cuáles están en servicio. Sin mesas configuradas no existe disponibilidad, así
 * que este servicio sostiene todo lo demás.
 */
import type { Zone } from '@/generated/prisma/enums';
import type { TableModel } from '@/generated/prisma/models';
import type { DomainErrorCode } from '@/lib/domain-error';
import { DomainError } from '@/lib/domain-error';
import { failure, success, type Result } from '@/lib/result';
import {
  createTable as createTableRow,
  findAllTables,
  findLargestConfirmedPartySize,
  findTableById,
  findTableByNumber,
  updateTable as updateTableRow,
} from '@/repositories/table.repository';

export type TableResult = Result<TableModel, DomainErrorCode>;

export type TableInput = {
  number: number;
  capacity: number;
  zone: Zone;
  active: boolean;
};

/** Todas las mesas del salón, incluidas las que están fuera de servicio. */
export function listTables(): Promise<TableModel[]> {
  return findAllTables();
}

export async function getTable(id: string): Promise<TableResult> {
  const table = await findTableById(id);

  if (table === null) {
    return failure(DomainError.TABLE_NOT_FOUND);
  }

  return success(table);
}

/**
 * Comprueba que el número de mesa no esté en uso.
 *
 * El número es cómo el personal nombra la mesa en el salón: dos mesas con el mismo número
 * harían ambiguo cualquier listado. Al editar se excluye la propia mesa, para que conservar
 * su número no cuente como duplicado.
 */
async function checkNumberIsFree(
  number: number,
  tableIdToIgnore?: string,
): Promise<DomainErrorCode | null> {
  const existing = await findTableByNumber(number);

  if (existing === null || existing.id === tableIdToIgnore) {
    return null;
  }

  return DomainError.TABLE_NUMBER_TAKEN;
}

export async function createTable(input: TableInput): Promise<TableResult> {
  const numberProblem = await checkNumberIsFree(input.number);

  if (numberProblem !== null) {
    return failure(numberProblem);
  }

  return success(await createTableRow(input));
}

/**
 * Actualiza una mesa.
 *
 * Además de la unicidad del número, impide reducir la capacidad por debajo de lo que ya está
 * comprometido: una mesa rebajada a dos plazas con una reserva confirmada para seis dejaría
 * al restaurante sin dónde sentar a ese grupo el día de la visita.
 *
 * Sobre desactivar una mesa (R9): no se cancelan sus reservas futuras. El personal decide
 * qué hacer con cada una, porque puede reubicarlas o el cierre puede ser temporal.
 */
export async function updateTable(id: string, input: TableInput): Promise<TableResult> {
  const found = await getTable(id);

  if (!found.ok) {
    return found;
  }

  const numberProblem = await checkNumberIsFree(input.number, id);

  if (numberProblem !== null) {
    return failure(numberProblem);
  }

  const largestParty = await findLargestConfirmedPartySize(id);

  if (input.capacity < largestParty) {
    return failure(DomainError.CAPACITY_BELOW_EXISTING_RESERVATIONS);
  }

  return success(await updateTableRow(id, input));
}

/** Pone una mesa en servicio o la retira, conservando el resto de su configuración. */
export async function setTableActive(id: string, active: boolean): Promise<TableResult> {
  const found = await getTable(id);

  if (!found.ok) {
    return found;
  }

  const table = found.value;

  return success(
    await updateTableRow(id, {
      number: table.number,
      capacity: table.capacity,
      zone: table.zone,
      active,
    }),
  );
}
