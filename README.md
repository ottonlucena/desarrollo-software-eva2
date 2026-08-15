# Sabor Gourmet — Sistema de Reservas

Aplicación web que reemplaza la gestión manual de reservas de un restaurante de alta cocina.
Permite al comensal consultar disponibilidad y reservar una mesa en línea, y al personal
administrar las reservas y la configuración del salón.

## Estado del proyecto

| Parte | Estado |
|---|---|
| Análisis y diseño (`docs/`) | ✅ Completo |
| Modelo de datos y migraciones | ✅ Completo |
| Portal público: reservar, consultar, modificar y cancelar | ✅ Completo |
| Panel del personal: reservas y configuración del salón | ✅ Completo |

## Tecnologías

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Framework | Next.js 16 (App Router) |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 17 |
| Validación | Zod 4 |

La justificación de cada elección, con las alternativas que se descartaron, está en
[`docs/stack.md`](./docs/stack.md).

## Cómo ejecutar el proyecto

**Requisitos:** Node.js 22 o superior, y Docker (solo para la base de datos).

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar el entorno
cp .env.example .env

# 3. Levantar PostgreSQL
npm run db:up

# 4. Crear las tablas
npm run db:migrate

# 5. Cargar las mesas iniciales del restaurante
npm run db:seed

# 6. Iniciar la aplicación
npm run dev
```

La aplicación queda disponible en <http://localhost:3000>.

### Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compilación para producción. |
| `npm run start` | Ejecuta la compilación de producción. |
| `npm run typecheck` | Comprueba los tipos sin generar archivos. |
| `npm run lint` | Analiza el código. |
| `npm run db:up` / `db:down` | Levanta o detiene PostgreSQL. |
| `npm run db:migrate` | Crea y aplica migraciones. |
| `npm run db:seed` | Carga las mesas iniciales. |
| `npm run db:studio` | Explorador visual de los datos. |
| `npm run db:reset` | Borra la base y la reconstruye desde cero. |

## Cómo está organizado el código

El proyecto sigue el patrón **MVC** con cuatro capas de responsabilidad única. Cada capa solo
conoce a la siguiente.

```
Navegador
   │  petición HTTP
   ▼
Controlador  ── src/app/**/actions.ts      valida la entrada y delega
   │
   ▼
Servicio     ── src/services/**            aplica las reglas de negocio
   │
   ▼
Repositorio  ── src/repositories/**        lee y escribe con Prisma
   │
   ▼
PostgreSQL
```

La respuesta vuelve por el mismo camino y se renderiza en la **vista** (`src/app/**`), que
solo muestra datos: nunca consulta la base ni contiene reglas de negocio.

```
.
├── docs/                     Análisis, diseño y decisiones del proyecto
├── prisma/
│   ├── schema.prisma         Modelo de datos: fuente única de la verdad
│   ├── migrations/           Historial versionado del esquema
│   └── seed.ts               Mesas iniciales del restaurante
├── src/
│   ├── app/                  Rutas, vistas y controladores (Server Actions)
│   │   ├── reservar/         Buscar disponibilidad y confirmar la reserva
│   │   ├── reserva/          Confirmación con el código
│   │   ├── mi-reserva/       Consultar, modificar y cancelar
│   │   └── admin/            Panel del personal: reservas y mesas
│   ├── proxy.ts              Filtro previo a las rutas del panel
│   ├── components/           Piezas de interfaz compartidas
│   ├── services/             Reglas de negocio
│   ├── repositories/         Acceso a datos
│   ├── validation/           Esquemas de validación con Zod
│   ├── lib/                  Utilidades e instancia de Prisma
│   └── generated/            Cliente de Prisma (se genera, no se versiona)
├── docker-compose.yml        PostgreSQL para desarrollo
└── prisma.config.ts          Configuración de la CLI de Prisma
```

## Modelo de datos

Tres entidades. El detalle de cada campo y de las reglas de negocio está en
[`docs/domain.md`](./docs/domain.md).

```
Customer  1 ──── *  Reservation  * ──── 1  Table
(cliente)             (reserva)             (mesa)
```

**Decisión central:** el servicio se modela como **turnos fijos** (13:00, 14:00, 15:00 para
almuerzo; 20:00, 21:00, 22:00 para cena) en lugar de horarios libres con duración estimada.
Así, la disponibilidad se resuelve con una comparación de igualdad en vez de un cálculo de
solapamiento de intervalos, y la regla *"una mesa no puede tener dos reservas confirmadas en
el mismo turno"* la garantiza un **índice único parcial** en PostgreSQL —no lógica de
aplicación que se pueda olvidar—, incluso si dos personas envían el formulario en el mismo
instante.

El comensal recibe un **código de reserva** (`SG-XXXXXX`) que, junto con su correo, le permite
consultar, modificar y cancelar sin necesidad de crear una cuenta.

## Panel del personal

Disponible en `/admin`, protegido con la clave definida en `ADMIN_ACCESS_KEY`.

| Pantalla | Qué permite |
|---|---|
| Reservas | Ver el listado del día, filtrar por fecha y estado, y abrir cada reserva. |
| Detalle de la reserva | Ver los datos de contacto del comensal, modificar la reserva o cancelarla. |
| Mesas | Registrar mesas, editarlas y ponerlas dentro o fuera de servicio. |

El acceso se comprueba en dos lugares. `proxy.ts` redirige cuanto antes a quien no traiga
sesión, para no cargar una pantalla que igualmente iba a rechazarse; y cada página y cada
acción vuelven a comprobarla, porque una acción se puede invocar sin pasar por la navegación.
La clave no se guarda en la galleta —solo su huella— y se compara en tiempo constante.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/brief.md`](./docs/brief.md) | El problema del restaurante y qué queda fuera del alcance. |
| [`docs/mvp.md`](./docs/mvp.md) | Alcance mínimo viable e historias de usuario. |
| [`docs/domain.md`](./docs/domain.md) | Entidades, atributos y reglas de negocio. |
| [`docs/stack.md`](./docs/stack.md) | Tecnologías elegidas y alternativas descartadas. |
| [`docs/architecture.md`](./docs/architecture.md) | Capas, MVC, SOLID y convenciones de código. |
| [`docs/design.md`](./docs/design.md) | Identidad visual y criterios de interfaz. |
