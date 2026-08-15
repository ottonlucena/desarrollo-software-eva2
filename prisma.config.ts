/**
 * Configuración de la línea de comandos de Prisma.
 *
 * Desde Prisma 7 la cadena de conexión ya no se declara en `schema.prisma`, sino aquí. Eso
 * mantiene el esquema como una descripción pura del modelo de datos, sin credenciales ni
 * detalles del entorno.
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Carga las mesas iniciales del restaurante. Ver `prisma/seed.ts`.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
