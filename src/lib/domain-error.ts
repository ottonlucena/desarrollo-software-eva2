/**
 * Catálogo de errores de negocio y sus mensajes para el comensal.
 *
 * Cada error corresponde a una regla documentada en `docs/domain.md`. Los servicios devuelven
 * el código —no el texto—, de modo que la capa de presentación decide cómo mostrarlo y el
 * mensaje se escribe una sola vez.
 *
 * Todo mensaje dice qué ocurrió y qué puede hacer la persona a continuación.
 */

export const DomainError = {
  /** R4: la mesa solicitada no existe. */
  TABLE_NOT_FOUND: 'TABLE_NOT_FOUND',
  /** R4: la mesa existe pero está fuera de servicio. */
  TABLE_INACTIVE: 'TABLE_INACTIVE',
  /** R1: ya hay una reserva confirmada para esa mesa, fecha y turno. */
  TABLE_ALREADY_BOOKED: 'TABLE_ALREADY_BOOKED',
  /** R2: el grupo supera la capacidad de la mesa. */
  PARTY_SIZE_EXCEEDS_CAPACITY: 'PARTY_SIZE_EXCEEDS_CAPACITY',
  /** R7: no existe una reserva con ese código y ese correo. */
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  /** R5: la reserva ya fue cancelada y no admite más cambios. */
  RESERVATION_ALREADY_CANCELLED: 'RESERVATION_ALREADY_CANCELLED',
} as const;

export type DomainErrorCode = (typeof DomainError)[keyof typeof DomainError];

const MESSAGES: Record<DomainErrorCode, string> = {
  [DomainError.TABLE_NOT_FOUND]:
    'La mesa seleccionada ya no existe. Vuelva a buscar disponibilidad para ver las mesas vigentes.',
  [DomainError.TABLE_INACTIVE]:
    'Esa mesa se encuentra fuera de servicio. Vuelva a buscar disponibilidad para elegir otra.',
  [DomainError.TABLE_ALREADY_BOOKED]:
    'Esa mesa acaba de ser reservada para ese turno. Vuelva a buscar disponibilidad y elija otra mesa.',
  [DomainError.PARTY_SIZE_EXCEEDS_CAPACITY]:
    'La mesa seleccionada no admite esa cantidad de comensales. Elija una mesa de mayor capacidad.',
  [DomainError.RESERVATION_NOT_FOUND]:
    'No encontramos una reserva con ese código y ese correo. Revise ambos datos e intente nuevamente.',
  [DomainError.RESERVATION_ALREADY_CANCELLED]:
    'Esa reserva ya está cancelada, por lo que no admite cambios. Puede crear una nueva reserva.',
};

/** Traduce un código de error de negocio al mensaje que ve el comensal. */
export function describeDomainError(code: DomainErrorCode): string {
  return MESSAGES[code];
}
