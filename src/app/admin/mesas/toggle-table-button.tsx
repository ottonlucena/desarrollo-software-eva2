/**
 * Control para poner una mesa en servicio o retirarla desde el propio listado.
 *
 * Es un componente de servidor: el formulario invoca la acción directamente, sin guardar
 * ningún estado en el navegador. Gracias a eso, cuando la acción termina Next.js vuelve a
 * dibujar el listado con los datos frescos y la fila refleja el cambio sin recargar a mano.
 *
 * La versión anterior mantenía el resultado de la acción en el navegador para mostrar un
 * aviso. Ese estado podía quedar desfasado del real y dejaba la fila diciendo "Retirar"
 * cuando la mesa ya estaba retirada. La confirmación ahora es la propia fila, que cambia de
 * estado a la vista.
 */
import { setTableActiveAction } from './actions';
import { TogglePendingButton } from './toggle-pending-button';

type ToggleTableButtonProps = {
  tableId: string;
  tableNumber: number;
  active: boolean;
};

export function ToggleTableButton({ tableId, tableNumber, active }: ToggleTableButtonProps) {
  /*
   * Se envía el estado deseado, no una orden de invertir el actual. Si la pantalla estuviera
   * desactualizada, invertir daría lo contrario de lo que la persona pidió; fijar un valor
   * absoluto da el mismo resultado aunque se pulse dos veces.
   *
   * `bind` fija la mesa y el estado como argumentos de la acción: no viajan en campos del
   * formulario, donde podrían alterarse para afectar a otra mesa.
   */
  const applyDesiredState = setTableActiveAction.bind(null, tableId, !active);

  return (
    <form action={applyDesiredState}>
      <TogglePendingButton active={active} tableNumber={tableNumber} />
    </form>
  );
}
