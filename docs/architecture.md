# Arquitectura — Sabor Gourmet

Este documento recoge las **decisiones de diseño** del sistema y el porqué de cada una. No es
un ADR: es el insumo del que después se extraen los ADRs definitivos.

## 1. Visión general

Un **monolito con renderizado en el servidor**. Un solo proceso sirve el portal público, el
panel de administración y la lógica de negocio, contra una sola base de datos relacional.

```
        Navegador (móvil / escritorio)
                    │
                    │ HTTP
                    ▼
    ┌───────────────────────────────────┐
    │        Aplicación (monolito)      │
    │                                   │
    │   Vistas  ←  Controladores        │   ← capa de presentación
    │                    │              │
    │              Servicios            │   ← reglas de negocio
    │                    │              │
    │             Repositorios          │   ← acceso a datos (ORM)
    └───────────────────────────────────┘
                    │
                    ▼
         Base de datos relacional
```

**Por qué monolito y no microservicios:** el sistema tiene tres entidades y dos pantallas.
Partirlo en servicios agregaría red, despliegue y fallas parciales para resolver un problema
de escala que este restaurante no tiene. La complejidad hay que ganársela, no asumirla.

**Por qué renderizado en el servidor:** el comensal entra desde el teléfono, muchas veces con
mala señal. Entregar HTML ya armado es más rápido que enviar un paquete de JavaScript que
después tiene que pedir los datos. Además hace explícita la separación entre vista y
controlador, que es el eje del patrón MVC.

## 2. Las cuatro capas y sus responsabilidades

Cada capa tiene **una sola** responsabilidad — el principio S de SOLID aplicado a nivel de
arquitectura, no solo de clase. Esta separación es lo que hace que el modelo, la vista y el
control puedan cambiar de forma independiente.

| Capa | Responsabilidad única | Qué tiene prohibido |
|---|---|---|
| **Vista** | Mostrar datos y capturar entrada del usuario. | Consultar la base de datos. Contener reglas de negocio. |
| **Controlador** | Recibir la petición, validar el formato de la entrada, llamar al servicio, elegir qué vista responder. | Contener reglas de negocio. Hablar con el ORM. |
| **Servicio** | Aplicar las reglas de negocio (R1–R9 del [dominio](./domain.md)) y coordinar la transacción. | Saber que existe HTTP. Armar HTML. |
| **Repositorio** | Leer y escribir entidades. | Decidir nada. |

**La regla práctica:** si un controlador tiene un `if` que no sea sobre el resultado de una
validación o de un servicio, esa lógica está en el lugar equivocado.

## 3. Cómo se aplica SOLID

No como decoración: en decisiones concretas y verificables.

### S — Responsabilidad única

- Cada capa hace una cosa (tabla anterior).
- Los servicios se dividen por entidad y no por pantalla: `ReservationService`,
  `TableService`, `AvailabilityService`. El cálculo de disponibilidad se separa de la
  gestión de reservas porque son dos razones distintas para cambiar: una cambia si cambia
  cómo se ofrecen las mesas, la otra si cambian las reglas de la reserva.
- La validación vive en esquemas propios, no repartida en los controladores.

### O — Abierto/cerrado

- Los **turnos y las zonas son enumerados**: agregar un turno de las 23:00 es añadir un valor,
  no tocar la lógica de disponibilidad.
- El cálculo de disponibilidad recibe los criterios como parámetros; sumar un criterio nuevo
  (por ejemplo, filtrar por zona) no obliga a reescribir el existente.

### L, I, D

Se aplican donde el framework las hace naturales: los controladores dependen de la
**interfaz** del servicio y no de su implementación, y los repositorios se inyectan en vez de
instanciarse. No forzamos abstracciones que no tengan un segundo implementador real — una
interfaz con una sola implementación y ningún plan de tener otra es ceremonia, no diseño.

## 4. Validación: dos anillos

```
Entrada del usuario
      │
      ▼
 ① Esquema de validación   → forma: tipos, rangos, formato de email, fecha no pasada
      │
      ▼
 ② Servicio                → reglas que necesitan la base de datos: capacidad, mesa libre,
      │                       estado de la reserva
      ▼
 ③ Base de datos           → última línea: restricciones únicas y claves foráneas
```

Cada anillo atrapa lo que el anterior no puede saber. El primero no puede saber si la mesa 4
está libre; el tercero no puede dar un mensaje amable. Los tres son necesarios.

**Los errores de negocio se devuelven como valor, no como excepción.** "La mesa ya está
reservada" no es un fallo del programa: es una respuesta legítima que la interfaz debe saber
mostrar. Las excepciones quedan para lo que de verdad es excepcional (la base de datos caída).

## 5. Convenciones de código

| Convención | Regla |
|---|---|
| Idioma | Código en inglés, interfaz en español. Ver [`domain.md` §4](./domain.md). |
| Tipado | Estricto. Nada de tipos comodín (`any`, `Object`) para esquivar el compilador. |
| Comentarios | Cada archivo abre con un bloque que explica **qué** hace y **por qué** existe. Los métodos con reglas de negocio explican la regla, no la sintaxis. |
| Migraciones | Siempre versionadas y en el repositorio. Nunca se modifica el esquema a mano. |
| Auditoría | Toda entidad guarda `createdAt`; las mutables además `updatedAt`. |
| Commits | Mensajes descriptivos en español, un cambio lógico por commit. |
| Formato | Un formateador automático configurado en el proyecto; nadie discute estilo en la revisión. |

## 6. Estructura de carpetas

Independiente del stack, el proyecto se organiza así:

```
sabor-gourmet/
├── docs/                  ← toda la documentación de este proyecto
├── <migraciones>/         ← esquema versionado
├── src/
│   ├── <vistas>/          ← plantillas o componentes
│   ├── <controladores>/   ← puntos de entrada HTTP
│   ├── <servicios>/       ← reglas de negocio
│   ├── <repositorios>/    ← acceso a datos
│   ├── <modelo>/          ← entidades y enumerados
│   └── <validacion>/      ← esquemas de entrada
├── <recursos estáticos>/
└── README.md
```

## 7. Variables de entorno

Se mantienen al mínimo. Cada una debe justificar su existencia.

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a la base de datos. |
| `ADMIN_ACCESS_KEY` | Barrera temporal del panel de administración (ver §8). |
| `APP_ENV` | `development` / `production`. |

Ninguna variable con secreto se sube al repositorio. Se versiona un `.env.example` con los
nombres y valores de ejemplo.

## 8. Deuda técnica declarada

Declararla es parte de la honestidad del diseño. Estas son decisiones conscientes, no
descuidos:

1. **El panel de administración no tiene autenticación real.** Se protege con una clave de
   acceso desde variable de entorno. Es suficiente mientras el panel se use desde el mesón
   del local; el siguiente paso natural es autenticación con usuarios y roles.
2. **No hay confirmación por email.** El código de reserva se muestra en pantalla y el
   comensal debe guardarlo.
3. **No hay paginación en el listado de administración.** Con el volumen de un restaurante y
   el filtro por fecha, el listado diario cabe en una pantalla. Se agrega cuando duela.

---

Siguiente documento: [`design.md`](./design.md) — la identidad visual.
