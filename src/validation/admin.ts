/**
 * Esquemas de validación de lo que envía el personal desde el panel.
 *
 * Se validan con el mismo rigor que los del comensal. Que la pantalla esté detrás de una
 * clave no hace confiables sus datos: la petición se puede construir a mano igual.
 */
import { z } from 'zod';

import { ReservationStatus, Zone } from '@/generated/prisma/enums';
import { parseServiceDate } from '@/lib/dates';

/** Cuántas plazas puede tener una mesa. Un salón no tiene mesas de cero ni de cincuenta. */
export const MIN_TABLE_CAPACITY = 1;
export const MAX_TABLE_CAPACITY = 20;

/**
 * Filtros del listado de reservas.
 *
 * Ambos son opcionales: sin fecha se ven todas, y sin estado se ven tanto las confirmadas
 * como las canceladas. La cadena vacía significa "sin filtrar", que es lo que envía un
 * desplegable con la opción "todas" seleccionada.
 */
export const reservationFilterSchema = z.object({
  date: z
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : (parseServiceDate(value) ?? undefined))),
  status: z
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .pipe(z.enum(ReservationStatus).optional()),
});

export type ReservationFilterInput = z.infer<typeof reservationFilterSchema>;

/** Datos de una mesa, tanto al crearla como al editarla. */
export const tableSchema = z.object({
  number: z.coerce
    .number({ message: 'Indique el número de la mesa.' })
    .int({ message: 'El número de mesa debe ser un número entero.' })
    .min(1, { message: 'El número de mesa debe ser mayor que cero.' }),
  capacity: z.coerce
    .number({ message: 'Indique la capacidad de la mesa.' })
    .int({ message: 'La capacidad debe ser un número entero.' })
    .min(MIN_TABLE_CAPACITY, { message: 'La mesa debe admitir al menos una persona.' })
    .max(MAX_TABLE_CAPACITY, {
      message: `La capacidad no puede superar las ${MAX_TABLE_CAPACITY} personas.`,
    }),
  zone: z.enum(Zone, { message: 'Elija uno de los sectores del salón.' }),
  // Una casilla sin marcar no se envía; por eso la ausencia del campo significa "inactiva".
  active: z
    .union([z.literal('on'), z.literal('true'), z.literal('')])
    .optional()
    .transform((value) => value === 'on' || value === 'true'),
});

export type TableFormInput = z.infer<typeof tableSchema>;
