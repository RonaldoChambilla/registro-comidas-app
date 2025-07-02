import type {
  RegisterOrderRequest,
  RegisterOrderConflictResponse,
  UpdateOrderStatusRequest,
  BackendPedidoResponse,
  Pedido, // La interfaz Pedido de nuestro frontend
  ComidaSeleccionada,
  BackendProductoDetail,
  BackendLugarEntregaDetail,
  ConflictingPedidoSummary,
} from '../types';

const BASE_URL = 'http://localhost:3000/delivery';

// Función auxiliar para mapear el estado numérico del backend a nuestro estado de texto
const mapEstadoPedido = (estado: number): 'Pendiente' | 'Entregado' | 'Anulado' => {
  switch (estado) {
    case 1: // Asumiendo que 1 es Pendiente
      return 'Pendiente';
    case 2: // Confirmado que 2 es Anulado
      return 'Anulado';
    // case X: // Si hay un estado para "Entregado", lo añadiríamos aquí
    //   return 'Entregado';
    default:
      return 'Pendiente'; // Valor por defecto si el estado no es reconocido
  }
};

// Función auxiliar para mapear el indicadorEstado del backend a nuestro estadoRegistro de texto
const mapEstadoRegistro = (indicador: string): 'Activo' | 'Eliminado' => {
  return indicador === 'A' ? 'Activo' : 'Eliminado'; // Asumiendo "A" para activo, cualquier otro para eliminado
};

// Función auxiliar para mapear detalles de producto/lugar del backend a ComidaSeleccionada
const mapComidaDetail = (
  producto?: BackendProductoDetail,
  lugar?: BackendLugarEntregaDetail
): ComidaSeleccionada | undefined => {
  if (!producto || !lugar) {
    return undefined;
  }
  return {
    tipoId: producto.idProducto,
    tipoNombre: producto.nombreProducto,
    lugarEntregaId: lugar.idLugarDestino,
    lugarEntregaNombre: lugar.nombre,
  };
};

/**
 * Registra un nuevo pedido en el backend.
 * @param data Los datos del pedido a registrar.
 * @returns Promesa que resuelve a void en éxito, o RegisterOrderConflictResponse en caso de conflicto.
 * @throws Error en caso de otros fallos en la red o el servidor.
 */
export const registerOrder = async (
  data: RegisterOrderRequest
): Promise<void | RegisterOrderConflictResponse> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return; // Éxito, no devuelve cuerpo en este caso
  } else if (response.status === 409) { // Código de conflicto
    const conflictData: RegisterOrderConflictResponse = await response.json();
    return conflictData;
  } else {
    // Manejar otros errores
    const errorData = await response.json();
    throw new Error(errorData.message || `Error al registrar pedido: ${response.status}`);
  }
};

/**
 * Actualiza el estado de un pedido específico.
 * @param orderId El ID del pedido a actualizar.
 * @param status El nuevo estado numérico (2 para Anulado).
 * @returns Promesa que resuelve a void en éxito.
 * @throws Error en caso de fallo en la red o el servidor.
 */
export const updateOrderStatus = async (orderId: number, status: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/actualizar-estado/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estadoPedido: status }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Error al actualizar estado del pedido: ${response.status}`);
  }
};

/**
 * Obtiene el historial de pedidos activos para un trabajador.
 * Mapea la respuesta del backend a la interfaz Pedido del frontend.
 * @param idTrabajador El ID del trabajador.
 * @param dni El DNI del trabajador (para completar la interfaz Pedido del frontend).
 * @param nombres Los nombres del trabajador (para completar la interfaz Pedido del frontend).
 * @returns Promesa que resuelve a un array de Pedido.
 * @throws Error en caso de fallo en la red o el servidor.
 */
export const getWorkerOrders = async (idTrabajador: number, dni: string, nombres: string): Promise<Pedido[]> => {
  const response = await fetch(`${BASE_URL}/cliente-pedidos/${idTrabajador}`);
  if (!response.ok) {
    throw new Error(`Error al obtener pedidos del trabajador: ${response.status}`);
  }
  const backendPedidos: BackendPedidoResponse[] = await response.json();

  // Mapear la respuesta del backend a nuestra interfaz Pedido del frontend
  return backendPedidos.map(bp => {
    // Unir las comidas para el campo 'comidas' en ConflictingPedidoSummary si es necesario,
    // o para un resumen en el historial. Aquí lo usamos para la descripción de comidas.
    const comidasList: string[] = [];
    if (bp.productoDesayuno) comidasList.push(`Desayuno: ${bp.productoDesayuno.nombreProducto}`);
    if (bp.productoAlmuerzo) comidasList.push(`Almuerzo: ${bp.productoAlmuerzo.nombreProducto}`);
    if (bp.productoCena) comidasList.push(`Cena: ${bp.productoCena.nombreProducto}`);

    return {
      id: bp.idPedido.toString(), // Convertir a string para consistencia con el frontend
      dni: dni, // Se pasa desde el contexto
      nombres: nombres, // Se pasa desde el contexto
      fechaServicio: bp.fechaPedido,
      desayuno: mapComidaDetail(bp.productoDesayuno, bp.lugarEntregaDesayuno),
      almuerzo: mapComidaDetail(bp.productoAlmuerzo, bp.lugarEntregaAlmuerzo),
      cena: mapComidaDetail(bp.productoCena, bp.lugarEntregaCena),
      fechaHoraRegistro: bp.trabajadorCliente.fechaRegistro,
      estadoPedido: mapEstadoPedido(bp.estadoPedido),
      estadoRegistro: mapEstadoRegistro(bp.indicadorEstado),
    };
  });
};


/**
 * Realiza un PATCH para reemplazar pedidos existentes en un rango de fechas.
 * @param idTrabajador El ID del trabajador (asumiendo que es el parámetro idclienteTrabajador en la URL).
 * @param data Los datos del pedido que reemplazarán a los existentes.
 * @returns Promesa que resuelve a void en éxito.
 * @throws Error en caso de fallo en la red o el servidor.
 */
export const patchOrderReplacement = async (idTrabajador: number, data: RegisterOrderRequest): Promise<void> => {
    // Asumiendo que 'idclienteTrabajador' en la URL PATCH se refiere al idTrabajador
    const response = await fetch(`${BASE_URL}/cliente-pedidos/${idTrabajador}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al reemplazar pedidos: ${response.status}`);
    }
};