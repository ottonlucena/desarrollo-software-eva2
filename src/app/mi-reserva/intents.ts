/**
 * Qué operación pidió la persona en la pantalla de gestión.
 *
 * Viaja como campo oculto del formulario. Las tres operaciones comparten una sola acción
 * para que la pantalla tenga un único estado: si cada una tuviera el suyo, la vista tendría
 * que decidir cuál de los tres es el vigente después de cada envío.
 *
 * Vive en su propio archivo porque un módulo marcado con `'use server'` solo puede exportar
 * funciones asíncronas.
 */
export const ManageIntent = {
  FIND: 'buscar',
  UPDATE: 'modificar',
  CANCEL: 'cancelar',
} as const;
