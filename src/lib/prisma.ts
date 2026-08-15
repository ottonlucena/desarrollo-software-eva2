/**
 * Instancia única (singleton) del cliente de Prisma.
 *
 * En desarrollo, Next.js recarga los módulos en caliente cada vez que se guarda un archivo.
 * Si el cliente se creara en cada recarga, se abriría un grupo de conexiones nuevo cada vez
 * hasta agotar las que acepta PostgreSQL. Por eso se guarda en el objeto global, que sí
 * sobrevive a las recargas.
 *
 * En producción no existe recarga en caliente, así que se crea una sola vez de forma natural
 * y no se toca el objeto global.
 */
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Prisma 7 se conecta a través de un adaptador de controlador en lugar de un motor binario
 * propio. El adaptador recibe la cadena de conexión y gestiona el grupo de conexiones.
 */
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    // En desarrollo conviene ver las consultas que se ejecutan; en producción, solo errores.
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
