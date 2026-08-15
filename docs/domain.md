# Modelo de dominio — Sabor Gourmet

Este documento define **qué existe** en el sistema, **cómo se relaciona** y **qué reglas** lo
gobiernan. Está escrito de forma independiente de la tecnología: describe el negocio, no la
implementación.

## 1. Las tres entidades

El dominio se reduce a tres conceptos: **clientes**, **mesas** y **reservas**.

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│   Customer   │        │    Reservation   │        │    Table     │
│  (Cliente)   │ 1    * │     (Reserva)    │ *    1 │    (Mesa)    │
├──────────────┤────────├──────────────────┤────────├──────────────┤
│ id           │        │ id               │        │ id           │
│ firstName    │        │ code       (UQ)  │        │ number  (UQ) │
│ lastName     │        │ customerId  (FK) │        │ capacity     │
│ email  (UQ)  │        │ tableId     (FK) │        │ zone         │
│ phone        │        │ date             │        │ active       │
│ createdAt    │        │ shift            │        │ createdAt    │
└──────────────┘        │ partySize        │        │ updatedAt    │
                        │ status           │        └──────────────┘
                        │ notes            │
                        │ createdAt        │
                        │ updatedAt        │
                        └──────────────────┘
```

### Customer — Cliente

Quien reserva. Se identifica por su **email**, que es único: si vuelve a reservar con el
mismo email, se reutiliza su registro en vez de duplicarlo.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | identificador | Generado por el sistema. |
| `firstName` | texto | Obligatorio, 2–50 caracteres. |
| `lastName` | texto | Obligatorio, 2–50 caracteres. |
| `email` | texto | Obligatorio, formato de email válido, **único**, normalizado a minúsculas. |
| `phone` | texto | Opcional, 8–15 caracteres. |
| `createdAt` | fecha-hora | Automático. |

> **Por qué el email es la identidad:** sin autenticación, necesitamos algo estable que el
> comensal recuerde y que nos permita reconocerlo. El email cumple ambas cosas y además es
> el canal natural de contacto.

### Table — Mesa

El recurso escaso del restaurante. Solo el personal las administra.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | identificador | Generado por el sistema. |
| `number` | entero | Obligatorio, **único**, mayor que 0. Es como la conoce el personal. |
| `capacity` | entero | Obligatorio, entre 1 y 20. Cuántos comensales caben. |
| `zone` | enumerado | `MAIN_HALL` (salón), `TERRACE` (terraza), `WINDOW` (ventanal), `PRIVATE` (privado). |
| `active` | booleano | Si está `false`, no aparece en disponibilidad. Por defecto `true`. |
| `createdAt` / `updatedAt` | fecha-hora | Automáticos. |

> **Por qué `active` en vez de borrar:** una mesa puede estar en reparación una semana y
> volver. Además, borrarla rompería el historial de reservas que la referencian. Se
> desactiva, no se elimina — es un borrado lógico.

### Reservation — Reserva

El corazón del sistema. Conecta un cliente con una mesa en un momento determinado.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | identificador | Generado por el sistema. |
| `code` | texto | **Único**, generado por el sistema. Formato `SG-XXXXXX` (6 caracteres alfanuméricos en mayúscula). Es la "llave" del comensal. |
| `customerId` | referencia | Obligatorio. A qué cliente pertenece. |
| `tableId` | referencia | Obligatorio. Qué mesa ocupa. |
| `date` | fecha | Obligatorio. No puede estar en el pasado. |
| `shift` | enumerado | Uno de los seis turnos definidos. |
| `partySize` | entero | Obligatorio, entre 1 y la `capacity` de la mesa. |
| `status` | enumerado | `CONFIRMED` o `CANCELLED`. |
| `notes` | texto | Opcional, máximo 280 caracteres. Alergias, cumpleaños, silla de bebé. |
| `createdAt` / `updatedAt` | fecha-hora | Automáticos. Auditoría mínima. |

> **Por qué solo dos estados:** un estado `PENDING` solo tiene sentido si algo debe
> confirmarse después (un pago, una llamada). En este MVP no existe ese paso, así que un
> tercer estado sería un campo que nunca cambia de valor. Se agrega el día que se agregue el
> pago, no antes.

### Shift — Turno (enumerado)

```
LUNCH_1300 · LUNCH_1400 · LUNCH_1500
DINNER_2000 · DINNER_2100 · DINNER_2200
```

Ver la justificación completa en [`mvp.md` §3](./mvp.md).

### Zone — Zona (enumerado)

```
MAIN_HALL · TERRACE · WINDOW · PRIVATE
```

## 2. Reglas de negocio

Estas son las reglas que el sistema debe hacer cumplir. Cada una indica **dónde** se aplica,
porque validar en el lugar correcto es parte de la calidad del código.

| # | Regla | Dónde se aplica |
|---|---|---|
| R1 | Una mesa no puede tener dos reservas **confirmadas** en la misma fecha y turno. | Restricción única en base de datos + verificación previa en el servicio para dar un mensaje claro. |
| R2 | `partySize` no puede superar la `capacity` de la mesa elegida. | Servicio (necesita consultar la mesa). |
| R3 | No se puede reservar en una fecha pasada. | Validación de esquema (Zod / Bean Validation). |
| R4 | Solo las mesas con `active = true` aparecen en disponibilidad y aceptan reservas nuevas. | Consulta de disponibilidad + servicio. |
| R5 | Una reserva `CANCELLED` no se puede modificar ni volver a cancelar. | Servicio. |
| R6 | Cancelar libera la mesa inmediatamente para ese turno. | Consecuencia de R1: la restricción única solo considera las `CONFIRMED`. |
| R7 | El comensal solo accede a su reserva con `code` **+** `email` coincidentes. | Servicio. Evita que alguien adivine códigos. |
| R8 | El email se normaliza a minúsculas antes de guardarse o buscarse. | Validación de esquema. |
| R9 | Desactivar una mesa no cancela sus reservas futuras; el personal decide qué hacer. | Servicio (y se avisa en la interfaz). |

> **Sobre R1 y la "regla de oro":** la restricción de unicidad vive en la base de datos, no
> solo en el código. Si dos personas envían el formulario en el mismo instante, la aplicación
> podría dejar pasar ambas; la base de datos no. La verificación en el servicio existe para
> dar un mensaje bonito, no para garantizar la regla.

## 3. Cómo se calcula la disponibilidad

Dado `fecha`, `turno` y `cantidadDePersonas`, una mesa está **disponible** si:

1. `active = true`, **y**
2. `capacity >= cantidadDePersonas`, **y**
3. no existe ninguna reserva con esa `tableId`, esa `date`, ese `shift` y `status = CONFIRMED`.

El resultado se ordena por `capacity` ascendente, para ofrecer primero la mesa más ajustada
al grupo y no malgastar una mesa de 8 en una pareja.

## 4. Convención de nombres

**El código y el modelo van en inglés; la interfaz de usuario va en español.**

Razón: los frameworks, los ORMs y las palabras reservadas ya están en inglés. Mezclar
(`crearReservaAction`, `ReservaRepository`) produce *spanglish*, que es exactamente lo que
hay que evitar. Una sola frontera clara —código en inglés, textos visibles en español— es
más fácil de sostener que una mezcla caso por caso.

```
✅ ReservationService.cancel()        →  botón "Cancelar reserva"
✅ Table.capacity                     →  etiqueta "Capacidad"
❌ ReservaService.cancelar()
❌ crearReservaAction()
```

---

Siguiente documento: [`stack.md`](./stack.md) — con qué tecnologías lo construimos.
