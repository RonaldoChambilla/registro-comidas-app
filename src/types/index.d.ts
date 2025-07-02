// Interfaces para la validación del DNI
export interface EmployeeValidationResponse {
  nombres: string;
  idTrabajador: number;
  idCliente: number;
}

// Interfaces para los datos de selección de comida y lugar (frontend internal model)
export interface ComidaSeleccionada {
  tipoId: number;
  tipoNombre: string;
  lugarEntregaId: number;
  lugarEntregaNombre: string;
}

// **MODIFICACIÓN O ACLARACIÓN DE LA INTERFAZ PEDIDO DEL FRONTEND**
// Esta interfaz representa cómo manejamos un pedido en el frontend para visualización.
// Necesitaremos mapear la respuesta del backend (BackendPedidoResponse) a esta interfaz.
export interface Pedido {
  id: string; // idPedido del backend, convertido a string
  dni: string; // Vendrá del contexto del trabajador validado
  nombres: string; // Vendrá del contexto del trabajador validado
  fechaServicio: string; // fechaPedido del backend
  desayuno?: ComidaSeleccionada;
  almuerzo?: ComidaSeleccionada;
  cena?: ComidaSeleccionada;
  fechaHoraRegistro: string; // fechaRegistro de trabajadorCliente del backend
  estadoPedido: 'Pendiente' | 'Entregado' | 'Anulado'; // Mapeado del estadoPedido numérico del backend
  estadoRegistro: 'Activo' | 'Eliminado'; // Mapeado del indicadorEstado del backend
}


// Interfaz para los datos que se envían al endpoint POST /delivery y PATCH /delivery/cliente-pedidos/{idclienteTrabajador}
export interface RegisterOrderRequest {
  IdTrabajador: number;
  IdCliente: number;
  FechaIngreso: string; // Formato 'YYYY-MM-DD'
  FechaSalida: string;  // Formato 'YYYY-MM-DD'
  IdProductoDesayuno?: number;
  IdProductoAlmuerzo?: number;
  IdProductoCena?: number;
  IdLugarEntregaDesayuno?: number;
  IdLugarEntregaAlmuerzo?: number;
  IdLugarEntregaCena?: number;
}

// Interfaces para la respuesta de conflicto del POST /delivery
export interface RegisterOrderConflictProducto {
  id: number;
  nombre: string;
}

export interface RegisterOrderConflictDetail {
  fecha: string; // Formato 'YYYY-MM-DD'
  productos: {
    desayuno?: RegisterOrderConflictProducto;
    almuerzo?: RegisterOrderConflictProducto;
    cena?: RegisterOrderConflictProducto;
  };
}

export interface RegisterOrderConflictResponse {
  message: string;
  conflictos: RegisterOrderConflictDetail[];
  rangoSolicitado: {
    desde: string;
    hasta: string;
  };
}

// Interfaz para la respuesta del GET /Producto/ALIMENTOS
export interface GetProductoAlimentosResponse {
  NombreProducto: string;
  IdProducto: number;
}

// Interfaz para la configuración de las opciones de comida (ej: Normal, Frio)
export interface TipoComida {
  id: number;
  nombre: string;
}

// Interfaz para la configuración de los lugares de entrega
export interface LugarEntrega {
  id: number;
  nombre: string;
}

// Interfaz para la respuesta del GET /lugar-destino
export interface GetLugarDestinoResponse {
  idLugarDestino: number;
  nombre: string;
}

// Interfaz para la solicitud PATCH /delivery/actualizar-estado/{ID del pedido}
export interface UpdateOrderStatusRequest {
  estadoPedido: number; // 2 para "Anulado"
}

// Interfaz para el resumen de pedidos en conflicto para el modal de confirmación
export interface ConflictingPedidoSummary {
  id: string; // ID del pedido en conflicto (si está disponible del backend)
  fechaServicio: string;
  comidas: string; // Resumen de comidas (ej: "Desayuno: Normal, Almuerzo: Frío")
  estadoPedido: 'Pendiente' | 'Entregado' | 'Anulado'; // Estado del pedido en conflicto
}

// Props para el modal de confirmación de reemplazo
export interface ReplaceConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirmReplace: () => void;
  conflictingPedidos: ConflictingPedidoSummary[];
  newOrderDates: string[]; // Fechas del nuevo pedido que generan el conflicto
}

// **NUEVAS INTERFACES PARA LA RESPUESTA DEL BACKEND: GET /delivery/cliente-pedidos/{ID del trabajador}**

export interface BackendProductoDetail {
  idProducto: number;
  nombreProducto: string;
  // Otros campos del producto en el backend, no todos son necesarios en el frontend
  nombreLargoProducto?: string;
  estadoProducto?: string;
  indicadorEstado?: string;
  usuarioRegistro?: string;
  fechaRegistro?: string;
  usuarioModificacion?: string | null;
  fechaModificacion?: string | null;
  costoUnitarioCompra?: string;
  precioUnitarioCompra?: string;
  fechaIngreso?: string | null;
  numeroOrdenProductoPorFamilia?: string | null;
  estadoSincronizacion?: string;
}

export interface BackendLugarEntregaDetail {
  idLugarDestino: number;
  nombre: string;
}

export interface TrabajadorClienteDetail {
  idTrabajador: number;
  idCliente: number;
  indicadorEstado: string;
  usuarioRegistro: string;
  fechaRegistro: string; // Esta es la fecha de registro de la relación trabajador-cliente, que usaremos para Pedido.fechaHoraRegistro
  usuarioModificacion: string | null;
  fechaModificacion: string | null;
}

// La interfaz principal para un pedido devuelto por el backend en el historial
export interface BackendPedidoResponse {
  idPedido: number;
  idTrabajador: number;
  idCliente: number;
  trabajadorCliente: TrabajadorClienteDetail;
  fechaPedido: string; // Fecha del servicio del pedido
  productoDesayuno?: BackendProductoDetail;
  productoAlmuerzo?: BackendProductoDetail;
  productoCena?: BackendProductoDetail;
  lugarEntregaDesayuno?: BackendLugarEntregaDetail;
  lugarEntregaAlmuerzo?: BackendLugarEntregaDetail;
  lugarEntregaCena?: BackendLugarEntregaDetail;
  estadoPedido: number; // Estado numérico del pedido (e.g., 1, 2)
  indicadorEstado: string; // Estado de registro del pedido ("A" para activo)
  usuarioRegistro: string;
  fechaModificacion: string | null;
}