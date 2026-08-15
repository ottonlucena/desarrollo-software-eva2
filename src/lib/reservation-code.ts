/**
 * Generación del código de reserva.
 *
 * El código es lo que reemplaza a una cuenta de usuario: junto con el correo, permite al
 * comensal consultar, modificar y cancelar su reserva sin registrarse.
 *
 * Se genera con el generador criptográfico del sistema y no con `Math.random()`, porque un
 * código predecible permitiría a un tercero encontrar reservas ajenas probando valores.
 */
import { randomInt } from 'node:crypto';

/**
 * Alfabeto sin caracteres que se confundan al dictarlos o transcribirlos: no están la O ni
 * el 0, ni la I, la L o el 1. El código se lee por teléfono y se copia a mano.
 */
const UNAMBIGUOUS_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const CODE_PREFIX = 'SG';
const CODE_LENGTH = 6;

/**
 * Devuelve un código con el formato `SG-XXXXXX`.
 *
 * La unicidad no depende de esta función, sino de la restricción `@unique` de la columna:
 * si dos códigos coincidieran, la base de datos rechazaría el segundo y el servicio lo
 * intentaría de nuevo.
 */
export function generateReservationCode(): string {
  let code = '';

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += UNAMBIGUOUS_CHARACTERS[randomInt(UNAMBIGUOUS_CHARACTERS.length)];
  }

  return `${CODE_PREFIX}-${code}`;
}

/**
 * Normaliza lo que la persona escribe en el formulario de consulta.
 *
 * Acepta minúsculas, espacios sobrantes y la ausencia del guion, porque son las tres formas
 * habituales de transcribir mal un código que se dictó por teléfono.
 */
export function normalizeReservationCode(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/[\s-]/g, '');

  if (!cleaned.startsWith(CODE_PREFIX)) {
    return `${CODE_PREFIX}-${cleaned}`;
  }

  return `${CODE_PREFIX}-${cleaned.slice(CODE_PREFIX.length)}`;
}
