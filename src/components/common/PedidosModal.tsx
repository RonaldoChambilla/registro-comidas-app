import React from 'react';
import type { Pedido } from '../../types'; // Importa la interfaz Pedido

interface PedidosModalProps {
  show: boolean;
  onHide: () => void;
  pedidos: Pedido[];
  onPedidoRecibido: (id: string) => void;
  onPedidoCancelar: (id: string) => void;
}

const PedidosModal: React.FC<PedidosModalProps> = ({ show, onHide, pedidos, onPedidoRecibido, onPedidoCancelar }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Historial de Pedidos</h5> {/* Título actualizado */}
            <button type="button" className="btn-close" aria-label="Close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {pedidos.length === 0 ? (
              <p className="text-center">No hay pedidos registrados para este empleado.</p> 
            ) : (
              <ul className="list-group">
                {pedidos
                  .filter(p => p.estadoRegistro === 'Activo') // <--- FILTRO: Solo mostrar pedidos 'Activo'
                  .sort((a, b) => new Date(b.fechaHoraRegistro).getTime() - new Date(a.fechaHoraRegistro).getTime())
                  .map(pedido => (
                    <li key={pedido.id} className="list-group-item mb-3 p-3 shadow-sm">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6>Pedido ID: {pedido.id}</h6>
                        <span className={`badge bg-${pedido.estadoPedido === 'Pendiente' ? 'warning' : pedido.estadoPedido === 'Entregado' ? 'success' : 'danger'}`}>
                          {pedido.estadoPedido}
                        </span>
                      </div>
                      <p className="mb-1"><strong>Fecha de Servicio:</strong> {pedido.fechaServicio}</p> {/* <--- CAMBIO AQUÍ: Ahora muestra fechaServicio */}
                      <p className="mb-1"><strong>Fecha de Registro:</strong> {new Date(pedido.fechaHoraRegistro).toLocaleString()}</p>
                      <p className="mb-1"><strong>DNI:</strong> {pedido.dni}</p>
                      <p className="mb-1"><strong>Nombres:</strong> {pedido.nombres}</p>
                      {/* <p className="mb-1"><strong>Período Laboral:</strong> {pedido.fechaIngreso} al {pedido.fechaSalida}</p> REMOVIDO: Ya no aplica para pedidos diarios */}

                      <h6 className="mt-3">Detalles de Comidas:</h6>
                      <ul className="list-unstyled mb-0">
                        {pedido.desayuno && (
                          <li><strong>Desayuno:</strong> {pedido.desayuno.tipoNombre} en {pedido.desayuno.lugarEntregaNombre}</li>
                        )}
                        {pedido.almuerzo && (
                          <li><strong>Almuerzo:</strong> {pedido.almuerzo.tipoNombre} en {pedido.almuerzo.lugarEntregaNombre}</li>
                        )}
                        {pedido.cena && (
                          <li><strong>Cena:</strong> {pedido.cena.tipoNombre} en {pedido.cena.lugarEntregaNombre}</li>
                        )}
                        {!pedido.desayuno && !pedido.almuerzo && !pedido.cena && (
                          <li>No se seleccionaron comidas para este pedido.</li>
                        )}
                      </ul>

                      {pedido.estadoPedido === 'Pendiente' && (
                        <div className="d-flex justify-content-end mt-3">
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => onPedidoRecibido(pedido.id)}
                          >
                            Marcar como Recibido
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onPedidoCancelar(pedido.id)}
                          >
                            Cancelar Pedido
                          </button>
                        </div>
                      )}
                      {pedido.estadoPedido !== 'Pendiente' && ( // <--- AJUSTE: Mostrar "No acciones" si no está pendiente
                        <div className="d-flex justify-content-end mt-3">
                          <span className="text-muted small">No acciones disponibles.</span>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosModal;