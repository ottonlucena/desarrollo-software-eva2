/**
 * Acceso a datos de los clientes.
 *
 * El correo es la identidad del comensal, así que todas las búsquedas parten de él. Llega ya
 * normalizado a minúsculas desde la capa de validación.
 */
import { prisma } from '@/lib/prisma';
import type { CustomerModel } from '@/generated/prisma/models';

export type CustomerData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

/**
 * Devuelve el cliente con ese correo, creándolo si aún no existe.
 *
 * Si ya existe, actualiza su nombre y teléfono: el comensal puede haber corregido cómo se
 * llama o cambiado de número desde su última visita, y sus datos más recientes son los que
 * el restaurante necesita para contactarlo.
 */
export function saveCustomer(data: CustomerData): Promise<CustomerModel> {
  return prisma.customer.upsert({
    where: { email: data.email },
    update: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
    },
    create: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone ?? null,
    },
  });
}

export function findCustomerByEmail(email: string): Promise<CustomerModel | null> {
  return prisma.customer.findUnique({ where: { email } });
}
