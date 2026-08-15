/**
 * Manejo de las fechas de servicio.
 *
 * Una reserva ocurre un **día**, no en un instante: la hora la aporta el turno. Por eso la
 * columna es de tipo `DATE` y aquí las fechas se construyen siempre a medianoche UTC.
 *
 * El motivo es evitar un error clásico: si se interpretara "2026-08-20" en la zona horaria
 * local, en Chile (UTC-4) se convertiría en las 04:00 UTC de ese día, y al leerla de vuelta
 * podría mostrarse como el día anterior. Fijando la hora en UTC, el día que se guarda es
 * exactamente el día que la persona eligió.
 */

/** Formato que usan tanto los campos `<input type="date">` como la URL: `AAAA-MM-DD`. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte un texto `AAAA-MM-DD` en la fecha de servicio correspondiente.
 * Devuelve `null` si el texto no tiene ese formato o no corresponde a un día real
 * (por ejemplo, un 31 de febrero).
 */
export function parseServiceDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  // `Date.UTC` no rechaza días inexistentes: los desborda al mes siguiente. Comparar las
  // partes de vuelta detecta esa corrección silenciosa.
  const isRealDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  return isRealDate ? parsed : null;
}

/** Representa una fecha de servicio como `AAAA-MM-DD`, tal como la esperan la URL y los formularios. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** El día de hoy como fecha de servicio. Es el primer día que se puede reservar. */
export function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Indica si una fecha de servicio ya pasó. Reservar hacia atrás no tiene sentido (R3). */
export function isPast(date: Date): boolean {
  return date.getTime() < today().getTime();
}

/** Suma días a una fecha de servicio. Se usa para acotar hasta cuándo se puede reservar. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Fecha en palabras, por ejemplo "jueves, 20 de agosto de 2026". */
export function describeDate(date: Date): string {
  return LONG_DATE_FORMATTER.format(date);
}

/** Fecha compacta, por ejemplo "20-08-2026". Se usa en listados densos. */
export function describeDateShort(date: Date): string {
  return SHORT_DATE_FORMATTER.format(date);
}
