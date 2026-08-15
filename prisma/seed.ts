/**
 * Carga los datos iniciales del restaurante.
 *
 * Sin mesas configuradas no existe disponibilidad y el sistema no puede usarse, así que
 * estas doce mesas son el punto de partida mínimo de cualquier instalación nueva.
 *
 * El script es idempotente: se puede ejecutar las veces que haga falta sin duplicar datos,
 * porque busca cada mesa por su número —que es único— antes de crearla.
 *
 *   npm run db:seed
 */
// A diferencia de Next.js, que lee `.env` por su cuenta, este script se ejecuta directamente
// con tsx y necesita cargar las variables de entorno de forma explícita.
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, Zone } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Distribución del salón: número de mesa, cuántos comensales admite y en qué sector está. */
const INITIAL_TABLES: Array<{ number: number; capacity: number; zone: Zone }> = [
  { number: 1, capacity: 2, zone: Zone.WINDOW },
  { number: 2, capacity: 2, zone: Zone.WINDOW },
  { number: 3, capacity: 2, zone: Zone.TERRACE },
  { number: 4, capacity: 4, zone: Zone.MAIN_HALL },
  { number: 5, capacity: 4, zone: Zone.MAIN_HALL },
  { number: 6, capacity: 4, zone: Zone.TERRACE },
  { number: 7, capacity: 4, zone: Zone.WINDOW },
  { number: 8, capacity: 6, zone: Zone.MAIN_HALL },
  { number: 9, capacity: 6, zone: Zone.MAIN_HALL },
  { number: 10, capacity: 8, zone: Zone.PRIVATE },
  { number: 11, capacity: 10, zone: Zone.PRIVATE },
  { number: 12, capacity: 12, zone: Zone.PRIVATE },
];

async function main(): Promise<void> {
  for (const table of INITIAL_TABLES) {
    // `upsert` sobre el número de mesa evita duplicados en ejecuciones sucesivas y permite
    // corregir la capacidad o la zona de una mesa ya existente.
    await prisma.table.upsert({
      where: { number: table.number },
      update: { capacity: table.capacity, zone: table.zone },
      create: table,
    });
  }

  const total = await prisma.table.count();
  console.log(`Mesas disponibles en el sistema: ${total}`);
}

main()
  .catch((error: unknown) => {
    console.error('No fue posible cargar los datos iniciales:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
