/**
 * Esquemas de validación de todo lo que el comensal escribe.
 *
 * Este es el primer anillo de validación descrito en `docs/architecture.md`: comprueba la
 * **forma** de los datos —tipos, rangos, formatos— antes de que lleguen a la lógica de
 * negocio. Lo que depende de la base de datos (si la mesa está libre, si la capacidad
 * alcanza) se comprueba después, en los servicios.
 *
 * Los esquemas viven aquí y no en los controladores para que cada regla se escriba una sola
 * vez, y porque de ellos se derivan los tipos de TypeScript: validación y tipo nunca se
 * pueden desincronizar.
 */
import { z } from 'zod';

import { Shift } from '@/generated/prisma/enums';
import { addDays, isPast, parseServiceDate, today } from '@/lib/dates';
import { normalizeReservationCode } from '@/lib/reservation-code';

/** Cuántos comensales admite la mesa más grande del salón. Acota el campo del formulario. */
export const MAX_PARTY_SIZE = 12;

/** Con cuánta anticipación se puede reservar. Más allá, el restaurante aún no publica turnos. */
export const MAX_DAYS_IN_ADVANCE = 90;

/**
 * Fecha del servicio.
 *
 * Se recibe como texto `AAAA-MM-DD` (lo que envían el campo de fecha y la URL) y se
 * transforma en `Date`, de modo que el resto del sistema nunca manipula cadenas.
 */
const serviceDateSchema = z
  .string()
  .trim()
  .min(1, { message: 'Indique la fecha de su visita.' })
  .transform((value, context) => {
    const parsed = parseServiceDate(value);

    if (parsed === null) {
      context.addIssue({ code: 'custom', message: 'Indique una fecha válida.' });
      return z.NEVER;
    }

    return parsed;
  })
  .refine((date) => !isPast(date), {
    message: 'Esa fecha ya pasó. Elija hoy o un día posterior.',
  })
  .refine((date) => date.getTime() <= addDays(today(), MAX_DAYS_IN_ADVANCE).getTime(), {
    message: `Aceptamos reservas con hasta ${MAX_DAYS_IN_ADVANCE} días de anticipación.`,
  });

/** Turno de entrada. Solo se aceptan los horarios que el restaurante ofrece. */
const shiftSchema = z.enum(Shift, { message: 'Elija uno de los horarios disponibles.' });

/** Cantidad de comensales. */
const partySizeSchema = z.coerce
  .number({ message: 'Indique cuántas personas asistirán.' })
  .int({ message: 'Indique un número entero de personas.' })
  .min(1, { message: 'La reserva debe ser para al menos una persona.' })
  .max(MAX_PARTY_SIZE, {
    message: `Para grupos de más de ${MAX_PARTY_SIZE} personas, comuníquese con el restaurante.`,
  });

/**
 * Correo electrónico del comensal.
 *
 * Se normaliza a minúsculas porque es la identidad del cliente (R8): sin normalizar,
 * "Ana@correo.cl" y "ana@correo.cl" crearían dos personas distintas.
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, { message: 'El correo no puede superar los 120 caracteres.' })
  .pipe(
    z.email({ message: 'Indique un correo válido, por ejemplo nombre@dominio.cl.' }),
  );

const personNameSchema = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .min(2, { message: `Indique su ${fieldLabel}.` })
    .max(50, { message: `Su ${fieldLabel} no puede superar los 50 caracteres.` });

const phoneSchema = z
  .string()
  .trim()
  .max(15, { message: 'El teléfono no puede superar los 15 caracteres.' })
  .refine((value) => value === '' || /^[+\d\s]{8,15}$/.test(value), {
    message: 'Indique un teléfono válido, por ejemplo +56 9 1234 5678.',
  })
  // Un campo opcional vacío se guarda como ausente, no como texto vacío.
  .transform((value) => (value === '' ? undefined : value));

const notesSchema = z
  .string()
  .trim()
  .max(280, { message: 'El comentario no puede superar los 280 caracteres.' })
  .transform((value) => (value === '' ? undefined : value));

/** Búsqueda de disponibilidad: los tres datos con los que empieza toda reserva. */
export const availabilitySearchSchema = z.object({
  date: serviceDateSchema,
  shift: shiftSchema,
  partySize: partySizeSchema,
});

export type AvailabilitySearch = z.infer<typeof availabilitySearchSchema>;

/** Datos completos para crear una reserva. */
export const createReservationSchema = z.object({
  date: serviceDateSchema,
  shift: shiftSchema,
  partySize: partySizeSchema,
  tableId: z.string().trim().min(1, { message: 'Elija una mesa disponible.' }),
  firstName: personNameSchema('nombre'),
  lastName: personNameSchema('apellido'),
  email: emailSchema,
  phone: phoneSchema,
  notes: notesSchema,
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

/**
 * Credenciales con las que el comensal accede a su reserva (R7).
 *
 * Se exigen los dos datos: el código por sí solo permitiría que un tercero que lo viera de
 * casualidad accediera a los datos personales de quien reservó.
 */
export const reservationLookupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: 'Indique el código de su reserva.' })
    .transform(normalizeReservationCode),
  email: emailSchema,
});

export type ReservationLookup = z.infer<typeof reservationLookupSchema>;

/** Cambios que el comensal puede aplicar a una reserva existente. */
export const updateReservationSchema = reservationLookupSchema.extend({
  date: serviceDateSchema,
  shift: shiftSchema,
  partySize: partySizeSchema,
  tableId: z.string().trim().min(1, { message: 'Elija una mesa disponible.' }),
  notes: notesSchema,
});

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
