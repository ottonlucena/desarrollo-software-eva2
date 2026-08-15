/**
 * Puente entre los formularios HTML y los esquemas de validación.
 *
 * Un formulario entrega siempre texto; los esquemas esperan datos con forma. Estas funciones
 * hacen la conversión en un solo lugar, para que ningún controlador repita la misma
 * gimnasia de leer campos y reordenar errores.
 */
import type { ZodType } from 'zod';

/** Errores de validación agrupados por campo, tal como los consume el formulario. */
export type FieldErrors = Record<string, string[]>;

/** Lo que la persona escribió, tal cual lo envió, para poder devolvérselo. */
export type SubmittedValues = Record<string, string>;

/**
 * Recoge los valores en crudo de un formulario.
 *
 * Sirve para devolverlos junto con los errores: al terminar una acción, React reinicia los
 * campos del formulario, así que sin esto alguien que se equivoca en una letra de su correo
 * perdería también su nombre, su teléfono y sus comentarios.
 */
export function readSubmittedValues(formData: FormData): SubmittedValues {
  const values: SubmittedValues = {};

  for (const [field, value] of formData.entries()) {
    // React agrega campos internos con el prefijo $ACTION que no pertenecen al formulario.
    if (typeof value === 'string' && !field.startsWith('$ACTION')) {
      values[field] = value;
    }
  }

  return values;
}

export type ValidationOutcome<TValue> =
  | { readonly valid: true; readonly data: TValue }
  | { readonly valid: false; readonly fieldErrors: FieldErrors };

/**
 * Valida los datos de un formulario contra un esquema.
 *
 * Se usa `safeParse` y no `parse` porque una entrada inválida es un caso esperado —alguien
 * escribió mal su correo—, no una situación excepcional que justifique lanzar un error.
 */
export function validateFormData<TValue>(
  schema: ZodType<TValue>,
  formData: FormData,
): ValidationOutcome<TValue> {
  const result = schema.safeParse(Object.fromEntries(formData));

  if (result.success) {
    return { valid: true, data: result.data };
  }

  return { valid: false, fieldErrors: result.error.flatten().fieldErrors as FieldErrors };
}

/**
 * Valida los parámetros de una URL contra un esquema.
 *
 * La búsqueda de disponibilidad viaja en la dirección para que el resultado se pueda
 * compartir, volver atrás o recargar. Como cualquiera puede editar la barra de direcciones,
 * esos valores se validan igual que los de un formulario.
 */
export function validateSearchParams<TValue>(
  schema: ZodType<TValue>,
  searchParams: Record<string, string | string[] | undefined>,
): ValidationOutcome<TValue> {
  const entries = Object.entries(searchParams).map(([key, value]) => [
    key,
    // Un parámetro repetido llega como arreglo; nos quedamos con la primera aparición.
    Array.isArray(value) ? (value[0] ?? '') : (value ?? ''),
  ]);

  const result = schema.safeParse(Object.fromEntries(entries));

  if (result.success) {
    return { valid: true, data: result.data };
  }

  return { valid: false, fieldErrors: result.error.flatten().fieldErrors as FieldErrors };
}

/** Primer mensaje de error de un campo, que es el que se muestra bajo él. */
export function firstError(errors: FieldErrors | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}
