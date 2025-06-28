// Define la interfaz para la respuesta de la API de validación de DNI
export interface EmployeeValidationResponse {
  nombres: string;
}

// Interfaz para los datos que vendrán del backend para lugares de entrega
export interface LugarEntrega {
  id: number;
  nombre: string;
}

// Interfaz para los datos que vendrán del backend para tipos de comida (Normal, Dieta, Frio)
export interface TipoComida {
  id: number;
  nombre: string;
}

// Define la interfaz para una comida seleccionada dentro de un pedido
export interface ComidaSeleccionada {
  tipoId: number;
  tipoNombre: string;
  lugarEntregaId: number;
  lugarEntregaNombre: string;
}

// Interfaz para cada pedido diario (como lo enviará el backend)
export interface Pedido {
  id: string; // ID único del pedido (probablemente el ID del registro original + la fecha)
  dni: string;
  nombres: string;
  fechaServicio: string; // La fecha específica para la que aplica este pedido (formato YYYY-MM-DD)
  desayuno?: ComidaSeleccionada;
  almuerzo?: ComidaSeleccionada;
  cena?: ComidaSeleccionada;
  fechaHoraRegistro: string; // Fecha y hora del registro original (puede ser la misma para varios pedidos diarios)
  estadoPedido: 'Pendiente' | 'Entregado' | 'Anulado'; // Estado del Pedido
  estadoRegistro: 'Activo' | 'Eliminado'; // Estado de Registro
}

// Interfaz para los pedidos que se mostraran en el modal de advertencia de reemplazo
export interface ConflictingPedidoSummary {
  id: string;
  fechaServicio: string;
  comidas: string; // Resumen de comidas (ej: "Desayuno: Normal, Almuerzo: Dieta")
  estadoPedido: 'Pendiente' | 'Entregado' | 'Anulado';
}

// Interfaz para el modal de confirmacion de reemplazo
export interface ReplaceConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirmReplace: () => void;
  conflictingPedidos: ConflictingPedidoSummary[];
  newOrderDates: string[]; // Fechas que se intentan registrar
}