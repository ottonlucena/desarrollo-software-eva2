/**
 * Tipo `Result`: representa el desenlace de una operación que puede fallar por una razón
 * prevista del negocio.
 *
 * Existe porque "la mesa ya está reservada" no es un fallo del programa, sino una respuesta
 * legítima que la interfaz debe saber mostrar. Devolverla como valor obliga a quien llama a
 * contemplar el caso —el compilador no deja leer `value` sin comprobar antes `ok`—, mientras
 * que una excepción se puede olvidar en silencio.
 *
 * Las excepciones quedan reservadas para lo que de verdad es excepcional: la base de datos
 * caída, un error de programación.
 */

/** Operación completada con éxito. */
export type Success<TValue> = { readonly ok: true; readonly value: TValue };

/** Operación rechazada por una razón conocida del negocio. */
export type Failure<TError> = { readonly ok: false; readonly error: TError };

export type Result<TValue, TError> = Success<TValue> | Failure<TError>;

export function success<TValue>(value: TValue): Success<TValue> {
  return { ok: true, value };
}

export function failure<TError>(error: TError): Failure<TError> {
  return { ok: false, error };
}
