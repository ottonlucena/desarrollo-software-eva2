# MVP — Sistema de Reservas "Sabor Gourmet"

El [brief](./brief.md) describe lo que el restaurante quiere. Este documento define **lo
mínimo que ya le entrega valor** y que somos capaces de construir bien, en vez de construir
mucho a medias.

Criterio de corte usado: *si sacar esta funcionalidad hace que el restaurante siga usando el
cuaderno, es MVP. Si no, queda fuera.*

## 1. Alcance del MVP

### Portal público (el comensal)

| # | Historia | Por qué es MVP |
|---|---|---|
| P1 | Como comensal, elijo fecha, turno y cantidad de personas y veo qué mesas hay disponibles. | Sin esto no puede reservar informadamente. Es el requisito de "mostrar disponibilidad". |
| P2 | Como comensal, completo mis datos y confirmo la reserva, y recibo un **código de reserva**. | Es el corazón del sistema. El código reemplaza al login. |
| P3 | Como comensal, con mi código y mi email puedo ver mi reserva. | Sin esto, el código no sirve de nada. |
| P4 | Como comensal, puedo **modificar** mi reserva (fecha, turno, personas, mesa). | Los planes cambian. Si modificar obliga a cancelar y volver a empezar, se pierde la mesa. |
| P5 | Como comensal, puedo **cancelar** mi reserva. | Es lo que libera la mesa y resuelve el problema de fondo del brief. |

### Panel de administración (el personal)

| # | Historia | Por qué es MVP |
|---|---|---|
| A1 | Como personal, veo el listado de reservas filtrado por fecha y estado. | Es la pantalla que reemplaza al cuaderno. |
| A2 | Como personal, puedo editar cualquier reserva. | La gente sigue llamando por teléfono; hay que poder registrarlo. |
| A3 | Como personal, puedo cancelar cualquier reserva. | Idem, y libera la mesa. |
| A4 | Como personal, administro las mesas: crear, editar, activar/desactivar. | Sin mesas configuradas no existe disponibilidad. Es el cimiento del sistema. |

### Transversal

| # | Requisito |
|---|---|
| T1 | Toda entrada de usuario se valida en el servidor antes de tocar la base de datos. |
| T2 | Toda la interfaz es responsiva (móvil primero). |
| T3 | Los errores se muestran al usuario en lenguaje claro, no como stack traces. |

## 2. Fuera del MVP (y por qué)

| Descartado | Razón |
|---|---|
| Autenticación real de usuarios | El comensal se identifica con código + email, que resuelve el caso completo. Obligarlo a crear una cuenta para reservar una mesa agrega fricción justo antes de convertir. |
| Login de administrador con roles | El restaurante tiene un equipo pequeño que comparte el mesón. El panel se protege con una barrera simple, documentada como deuda técnica. |
| Envío de emails / SMS | Depende de un servicio externo (SMTP) que agrega configuración, costo y un punto de falla, para algo que la pantalla de confirmación ya resuelve. |
| Pagos o señas | Fuera del brief. |
| Reservas recurrentes o de grupos grandes con varias mesas | Una reserva = una mesa. Simplifica el modelo sin quitarle valor al caso típico. |
| Lista de espera | El restaurante no la pidió. |
| Reportes y estadísticas | El restaurante no los pidió. Antes de medir hay que tener datos, y hoy no los tiene. |

## 3. La decisión que simplifica todo: turnos fijos

El sistema tiene que mostrar disponibilidad de mesas en tiempo real. La forma ingenua de
hacerlo es tratar cada reserva como un intervalo de tiempo (`19:30` + una duración estimada)
y calcular solapamientos. Eso es complejo, frágil y difícil de explicar.

**Decidimos modelar el servicio como turnos discretos.** El restaurante ofrece un conjunto
cerrado de horarios de entrada:

```
Almuerzo:  13:00 · 14:00 · 15:00
Cena:      20:00 · 21:00 · 22:00
```

Una mesa está ocupada en un turno o no lo está. No hay solapamiento parcial que calcular.

Consecuencias de esta decisión:

- **Disponibilidad = una consulta de igualdad**, no un cálculo de intervalos. Es rápida,
  correcta y trivial de verificar.
- La regla de negocio "una mesa no puede tener dos reservas activas en el mismo turno" se
  puede garantizar con una **restricción única en la base de datos** (`mesa + fecha + turno`
  entre las reservas activas), no con lógica de aplicación que se puede olvidar.
- El comensal entiende mejor la oferta: elige entre seis horarios claros en vez de escribir
  una hora libre que quizás no exista.
- Es exactamente cómo opera un restaurante con servicio por turnos, así que no es una
  simplificación artificial: es un modelo de dominio correcto.

Esta es la decisión de diseño más importante del proyecto y hay que poder defenderla.

## 4. Definición de "terminado"

El MVP está terminado cuando, con la aplicación corriendo:

1. Se puede completar el recorrido P1 → P2 → P3 → P4 → P5 desde un teléfono, sin errores
   visibles.
2. Se puede completar el recorrido A4 → A1 → A2 → A3 desde el panel.
3. Un intento de reservar una mesa ya tomada en ese turno es rechazado con un mensaje claro.
4. Un formulario con datos inválidos (email mal escrito, 0 personas, fecha en el pasado, más
   personas que la capacidad de la mesa) es rechazado con un mensaje por campo.
5. Todo el código está comentado y documentado: cada archivo explica qué hace y por qué
   existe.

---

Siguiente documento: [`domain.md`](./domain.md) — el modelo de datos y las reglas.
