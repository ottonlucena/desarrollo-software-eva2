/**
 * Campos de una mesa: número, capacidad, sector y si está en servicio.
 *
 * Los comparten el formulario de alta y el de edición, que piden exactamente los mismos
 * datos. Escribirlos dos veces haría que una corrección se aplicara solo a uno de los dos.
 */
'use client';

import { Field } from '@/components/field';
import formStyles from '@/components/forms.module.css';
import { Zone } from '@/generated/prisma/enums';
import { describeZone } from '@/lib/zones';
import { firstError, type FieldErrors } from '@/validation/form';
import { MAX_TABLE_CAPACITY, MIN_TABLE_CAPACITY } from '@/validation/admin';

import styles from './page.module.css';

/**
 * Valores iniciales de los campos.
 *
 * Son cadenas porque provienen indistintamente de la base de datos o de lo que la persona
 * acababa de escribir cuando el envío fue rechazado, y un formulario solo maneja texto.
 */
export type TableValues = {
  number: string;
  capacity: string;
  zone: string;
  active: boolean;
};

type TableFieldsProps = {
  values: TableValues;
  errors: FieldErrors | undefined;
  /**
   * Prefijo del atributo `id` de cada campo. Cuando hay varios formularios de mesa en la
   * misma página, un identificador repetido haría que todas las etiquetas apuntaran al
   * primer campo.
   */
  idPrefix: string;
};

export function TableFields({ values, errors, idPrefix }: TableFieldsProps) {
  return (
    <>
      <div className={formStyles.row}>
        <Field name={`${idPrefix}number`} label="Número" error={firstError(errors, 'number')}>
          {(field) => (
            <input
              {...field}
              name="number"
              type="number"
              min={1}
              defaultValue={values.number}
              required
            />
          )}
        </Field>

        <Field
          name={`${idPrefix}capacity`}
          label="Capacidad"
          hint={`Entre ${MIN_TABLE_CAPACITY} y ${MAX_TABLE_CAPACITY} personas.`}
          error={firstError(errors, 'capacity')}
        >
          {(field) => (
            <input
              {...field}
              name="capacity"
              type="number"
              min={MIN_TABLE_CAPACITY}
              max={MAX_TABLE_CAPACITY}
              defaultValue={values.capacity}
              required
            />
          )}
        </Field>
      </div>

      <Field name={`${idPrefix}zone`} label="Sector" error={firstError(errors, 'zone')}>
        {(field) => (
          <select {...field} name="zone" defaultValue={values.zone}>
            {Object.values(Zone).map((zone) => (
              <option key={zone} value={zone}>
                {describeZone(zone)}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className={styles.checkboxField}>
        <input
          id={`${idPrefix}active`}
          name="active"
          type="checkbox"
          defaultChecked={values.active}
          className={styles.checkbox}
        />
        <label htmlFor={`${idPrefix}active`} className={formStyles.label}>
          En servicio
          <span className={formStyles.hint}>
            Las mesas fuera de servicio no se ofrecen a los comensales.
          </span>
        </label>
      </div>
    </>
  );
}
