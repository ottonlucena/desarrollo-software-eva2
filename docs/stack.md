# Elección tecnológica y su justificación

Qué tecnologías elegimos para construir Sabor Gourmet y por qué. Cada elección responde a una
necesidad concreta del proyecto descrito en el [brief](./brief.md), no a la preferencia
personal ni a lo que esté de moda.

## Resumen

| Capa | Elección |
|---|---|
| Lenguaje | TypeScript |
| Framework | Next.js (App Router) |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Validación | Zod |
| Estilos | CSS propio sobre una base ligera |

## 1. Lenguaje: TypeScript

El sistema tiene reglas que se pueden violar en silencio: confundir una fecha con un texto,
pasar una capacidad donde iba una cantidad de comensales, olvidar comprobar si una reserva
existe. TypeScript convierte esos errores en fallos de compilación en vez de errores en
producción.

Con enumerados para turnos, zonas y estados, un turno inválido **no se puede escribir**. Esa
garantía la da el lenguaje, gratis, y evita toda una familia de validaciones manuales.

Regla del proyecto: **tipado estricto y sin `any`**. Un `any` es renunciar a la única razón
por la que elegimos este lenguaje.

## 2. Framework: Next.js

Necesitamos una sola aplicación que sirva dos interfaces —el portal público y el panel de
administración— con renderizado en el servidor y buen rendimiento en móvil. Next.js resuelve
eso sin pegar dos proyectos.

**Cómo se mapea al patrón MVC:**

| MVC | En Next.js |
|---|---|
| **Modelo** | Entidades y consultas Prisma, encapsuladas en la capa de repositorios. |
| **Vista** | Componentes React renderizados en el servidor. |
| **Controlador** | Server Actions y route handlers: reciben la petición, validan, delegan al servicio y eligen la respuesta. |

Esta correspondencia es directa y verificable en la estructura de carpetas, que es
justamente lo que buscábamos: que la arquitectura se vea sin tener que explicarla.

**Otras razones:**

- **Un solo lenguaje** en todo el stack. No hay que cambiar de mentalidad entre servidor y
  navegador, ni mantener dos conjuntos de tipos para la misma entidad.
- Los **Server Actions** eliminan la capa de API REST intermedia para un CRUD como este.
  Menos código de transporte es menos código donde equivocarse.
- El renderizado en servidor entrega HTML listo, que es lo que necesita un comensal con mala
  señal.

**Contra qué lo comparamos:**

| Alternativa | Por qué no |
|---|---|
| Spring Boot + Thymeleaf | Robusto y muy usado en empresa, pero pesado para tres entidades: más configuración, más ceremonia y dos lenguajes que mantener. La productividad no compensa en este alcance. |
| Express + React (SPA separada) | Obliga a mantener dos proyectos, una API entre ambos y tipos duplicados. Más piezas para el mismo resultado. |
| Laravel | Excelente para CRUD, pero introduce un tercer lenguaje al equipo sin ventaja clara aquí. |

**El costo que aceptamos:** Next.js tarda en arrancar en desarrollo y trae más superficie de
la que este proyecto necesita. Lo asumimos a cambio de la coherencia de un solo lenguaje y de
un despliegue simple.

## 3. ORM: Prisma

Toda operación de base de datos pasa por el ORM. No hay SQL suelto en el proyecto.

**Por qué Prisma y no otro:**

- **El esquema es un solo archivo legible.** Las tres entidades, sus relaciones y sus
  restricciones se leen de corrido. Ese archivo es documentación viva del modelo de datos.
- **Los tipos se generan desde el esquema.** Si se renombra un campo, el compilador señala
  todos los lugares que hay que corregir. Un ORM sin esto obliga a buscar a mano.
- **Migraciones versionadas.** Cada cambio de esquema queda como archivo en el repositorio,
  aplicable en cualquier máquina en el mismo orden. Nadie toca la base a mano.
- **Restricciones declarativas.** La regla "una mesa no puede tener dos reservas confirmadas
  en el mismo turno" se declara como índice único en el esquema, y la garantiza el motor de
  base de datos aunque la aplicación se equivoque.
- **Carga explícita de relaciones**, que evita el problema de las N+1 consultas: se pide
  reserva + cliente + mesa en una sola llamada, en vez de una consulta por fila.

**Contra qué lo comparamos:** TypeORM (los decoradores dispersan el modelo entre muchos
archivos y las migraciones son más frágiles), Drizzle (excelente, pero más cercano al SQL y
con menos ayuda para quien recién modela), y consultas SQL a mano (descartado: cero seguridad
de tipos y toda la responsabilidad de escapar valores queda en nosotros).

## 4. Base de datos: PostgreSQL

Los datos son **relacionales por naturaleza**: un cliente tiene muchas reservas, una mesa
tiene muchas reservas, y una reserva no existe sin ambos. Forzar esto en un modelo de
documentos significaría duplicar datos o resolver a mano lo que las claves foráneas hacen
solas.

Además necesitamos dos cosas que un motor relacional da de fábrica:

1. **Restricciones únicas** que impidan la doble reserva incluso ante peticiones simultáneas.
2. **Transacciones**: crear un cliente y su reserva debe ser una operación única e indivisible.
   Si la segunda falla, la primera no debe quedar a medias.

PostgreSQL sobre MySQL por su mejor manejo de tipos y por integrarse limpiamente con Prisma;
sobre SQLite porque, aunque es cómodo en desarrollo, su manejo de escrituras concurrentes no
representa bien el escenario real de un restaurante.

## 5. Validación: Zod

Toda entrada de usuario se valida contra un esquema antes de llegar a la lógica de negocio.

- **Un esquema, dos usos:** valida en tiempo de ejecución y además genera el tipo de
  TypeScript. No existe la posibilidad de que la validación y el tipo se desincronicen.
- Los esquemas viven en su propia capa, no repartidos entre los controladores: la regla
  "el nombre tiene entre 2 y 50 caracteres" se escribe una vez.
- Los mensajes de error se definen por campo, en español, y el formulario los muestra donde
  corresponde.

Lo que Zod **no** valida es lo que depende de la base de datos —si la mesa está libre, si la
capacidad alcanza—. Eso vive en los servicios. La frontera está descrita en
[`architecture.md` §4](./architecture.md).

## 6. Estilos

CSS propio siguiendo el sistema definido en [`design.md`](./design.md), sobre una base ligera
de normalización. La identidad visual del restaurante es específica —paleta sobria, tipografía
serif, mucho aire— y partir de un framework de componentes significaría pelear contra sus
valores por defecto en cada pantalla. Con un sistema de espaciado y color propio, escribimos
menos y controlamos más.

## 7. Lo que decidimos no incluir

| Descartado | Razón |
|---|---|
| Contenedor para la aplicación | Docker se usa **solo para la base de datos** (ver §8). Empaquetar además la aplicación agregaría una reconstrucción de imagen en cada cambio, a cambio de nada durante el desarrollo. |
| Biblioteca de gestión de estado | Con renderizado en servidor, el estado vive en el servidor y en la URL. Agregarla sería resolver un problema que no tenemos. |
| Capa de caché | Sin volumen que la justifique, solo agregaría datos desactualizados. |

## 8. Entorno de desarrollo: PostgreSQL en Docker

La base de datos se levanta con `docker compose up -d` a partir de un `docker-compose.yml`
que contiene un único servicio: PostgreSQL 17.

**Por qué:** instalar PostgreSQL en cada máquina significa versiones distintas, rutas
distintas y errores que solo le ocurren a una persona del equipo. Un contenedor garantiza que
todos trabajen contra el mismo motor, y basta un comando para partir de cero.

La aplicación **no** se ejecuta en un contenedor: corre con `npm run dev` en la máquina, que
es más rápido para desarrollar y no necesita reconstruir una imagen en cada cambio. El puerto
se publica en el 5433 del anfitrión para no chocar con una instalación local de PostgreSQL.

---

Documentos relacionados: [`architecture.md`](./architecture.md) · [`domain.md`](./domain.md) · [`design.md`](./design.md)
