/**
 * Turnos de servicio del restaurante y cómo se presentan al comensal.
 *
 * El sistema modela el servicio como un conjunto cerrado de horarios de entrada en lugar de
 * horas libres con una duración estimada. Gracias a eso, saber si una mesa está ocupada es
 * comparar dos valores y no calcular si dos intervalos se solapan (ver `docs/mvp.md`).
 *
 * Agregar un turno nuevo consiste en añadirlo al enumerado del esquema y describirlo aquí:
 * ninguna otra parte del sistema necesita cambiar.
 */
import { Shift } from '@/generated/prisma/enums';

/** Momento del día al que pertenece un turno. Agrupa los horarios en la interfaz. */
export const Service = {
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
} as const;

export type ServiceName = (typeof Service)[keyof typeof Service];

type ShiftDescription = {
  /** Hora de entrada tal como se muestra al comensal. */
  readonly time: string;
  readonly service: ServiceName;
};

/**
 * Descripción de cada turno. El orden de este objeto es el orden en que se ofrecen los
 * horarios en pantalla: primero el almuerzo, después la cena.
 */
export const SHIFTS: Readonly<Record<Shift, ShiftDescription>> = {
  [Shift.LUNCH_1300]: { time: '13:00', service: Service.LUNCH },
  [Shift.LUNCH_1400]: { time: '14:00', service: Service.LUNCH },
  [Shift.LUNCH_1500]: { time: '15:00', service: Service.LUNCH },
  [Shift.DINNER_2000]: { time: '20:00', service: Service.DINNER },
  [Shift.DINNER_2100]: { time: '21:00', service: Service.DINNER },
  [Shift.DINNER_2200]: { time: '22:00', service: Service.DINNER },
};

/** Todos los turnos, en el orden en que se ofrecen. */
export const SHIFT_ORDER = Object.keys(SHIFTS) as Shift[];

const SERVICE_LABELS: Readonly<Record<ServiceName, string>> = {
  [Service.LUNCH]: 'Almuerzo',
  [Service.DINNER]: 'Cena',
};

/** Etiqueta completa de un turno, por ejemplo "Cena · 21:00". */
export function describeShift(shift: Shift): string {
  const { time, service } = SHIFTS[shift];
  return `${SERVICE_LABELS[service]} · ${time}`;
}

/** Hora de entrada de un turno, por ejemplo "21:00". */
export function shiftTime(shift: Shift): string {
  return SHIFTS[shift].time;
}

/** Nombre del servicio al que pertenece un turno, por ejemplo "Cena". */
export function describeService(service: ServiceName): string {
  return SERVICE_LABELS[service];
}

/** Turnos agrupados por servicio, para presentarlos en dos bloques. */
export function shiftsByService(): Array<{ service: ServiceName; shifts: Shift[] }> {
  return [Service.LUNCH, Service.DINNER].map((service) => ({
    service,
    shifts: SHIFT_ORDER.filter((shift) => SHIFTS[shift].service === service),
  }));
}
