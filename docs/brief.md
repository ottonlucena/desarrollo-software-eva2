# Brief — Sistema de Reservas "Restaurante pa’ que mi suegra"

> Nuestra lectura del problema, escrita con nuestras palabras: qué necesita realmente el
> restaurante, qué vamos a construir y por qué.

## 1. El cliente

"Restaurante pa’ que mi suegra" es un restaurante que hoy gestiona sus reservas de forma manual: alguien
anota en un cuaderno o una planilla quién viene, cuándo y a qué mesa. Nos contratan porque
ese método les está costando dinero y prestigio.

## 2. El problema real

El método manual falla por cuatro razones concretas:

1. **Solo funciona en horario de atención.** Si un cliente quiere reservar a las 2 de la
   madrugada, no puede. Esa reserva se pierde o se va a la competencia.
2. **Depende de una persona.** Quien atiende el teléfono es el único que sabe qué está
   ocupado. Si no está, nadie puede confirmar nada.
3. **Se cometen errores de doble asignación.** Dos personas terminan con la misma mesa a la
   misma hora porque la información no está en un solo lugar.
4. **Cancelar o cambiar es caro.** El cliente tiene que llamar, y si no llama, la mesa queda
   reservada y vacía. El restaurante pierde el cupo sin saberlo.

El costo de fondo no es "no tener una app". Es **mesas vacías que estaban marcadas como
ocupadas** y **clientes perdidos fuera de horario**.

## 3. Qué se nos pide construir

Una aplicación web que reemplace el cuaderno. Tiene dos públicos con necesidades distintas:

**El comensal** quiere, desde su teléfono y sin llamar por teléfono:
- Ver si hay mesa disponible para el día, la hora y la cantidad de personas que necesita.
- Reservar en ese momento y recibir una confirmación.
- Modificar o cancelar su reserva después, sin depender de que alguien le conteste.

**El personal del restaurante** quiere, desde el mesón o una tablet:
- Ver todas las reservas del día en una sola pantalla.
- Editar o cancelar cualquier reserva (porque en la vida real la gente llama igual).
- Administrar las mesas del local: cuántas hay, de qué capacidad, en qué zona, y cuáles
  están fuera de servicio.

## 4. Qué NO estamos resolviendo

Delimitar esto es parte del trabajo. Quedan fuera del encargo:

- Cobros, señas o pagos en línea.
- Envío de correos o SMS de confirmación.
- Carta digital, pedidos o delivery.
- Programa de fidelización o puntos.
- Gestión de personal, turnos de garzones o inventario.
- Reportes analíticos o de facturación.

## 5. Restricciones que vienen dadas

- El sistema sigue el patrón **MVC**, con separación clara entre modelo, vista y controlador.
- La persistencia se resuelve con un **ORM**, no con SQL escrito a mano.
- La interfaz es **responsiva**: tiene que funcionar igual de bien en un teléfono que en el
  computador del mesón.
- El código y su documentación pesan tanto como la funcionalidad: otra persona debe poder
  tomar este proyecto, entenderlo y continuarlo.

## 6. Criterio de éxito

El proyecto está bien hecho si un comensal puede reservar una mesa desde su teléfono en
menos de un minuto, y si el personal puede ver y corregir esa reserva en la pantalla del
restaurante sin ambigüedad sobre qué mesa quedó tomada.

---

Siguiente documento: [`mvp.md`](./mvp.md) — qué recorte de esto construimos realmente.
