/**
 * Sectores del salón y cómo se nombran ante el comensal.
 *
 * El enumerado vive en inglés junto con el resto del modelo; los nombres visibles se
 * traducen aquí, en un único lugar.
 */
import { Zone } from '@/generated/prisma/enums';

const ZONE_LABELS: Readonly<Record<Zone, string>> = {
  [Zone.MAIN_HALL]: 'Salón principal',
  [Zone.TERRACE]: 'Terraza',
  [Zone.WINDOW]: 'Ventanal',
  [Zone.PRIVATE]: 'Salón privado',
};

/** Todos los sectores, en el orden en que se presentan. */
export const ZONE_ORDER = Object.keys(ZONE_LABELS) as Zone[];

/** Nombre visible de un sector, por ejemplo "Terraza". */
export function describeZone(zone: Zone): string {
  return ZONE_LABELS[zone];
}
