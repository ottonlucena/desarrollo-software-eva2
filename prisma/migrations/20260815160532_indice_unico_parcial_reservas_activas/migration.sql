-- Convierte la restricción de mesa+fecha+turno en un índice ÚNICO PARCIAL.
--
-- Motivo: el índice que genera Prisma alcanza a todas las reservas, incluidas las
-- canceladas. Con ese índice, una mesa cancelada seguiría bloqueando su turno para siempre,
-- porque la fila cancelada continúa ocupando la combinación (mesa, fecha, turno).
--
-- La condición `WHERE status = 'CONFIRMED'` hace que la restricción solo considere las
-- reservas vigentes: cancelar libera la mesa de inmediato, y el motor de base de datos sigue
-- garantizando que no existan dos reservas confirmadas para la misma mesa en el mismo turno,
-- incluso ante dos formularios enviados en el mismo instante.
--
-- Prisma no puede expresar índices parciales en `schema.prisma`, por eso esta migración se
-- escribe a mano.

DROP INDEX "reservations_tableId_date_shift_key";

CREATE UNIQUE INDEX "reservations_active_table_slot_key"
  ON "reservations" ("tableId", "date", "shift")
  WHERE "status" = 'CONFIRMED';
