import React from 'react';
import type { ReplaceConfirmationModalProps } from '../../types'; // Importar la interfaz

const ReplaceConfirmationModal: React.FC<ReplaceConfirmationModalProps> = ({
  show,
  onHide,
  onConfirmReplace,
  conflictingPedidos,
  newOrderDates,
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title">Advertencia: Conflicto de Pedidos Existentes</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <p>El rango de fechas que intentas registrar **({newOrderDates[0]} al {newOrderDates[newOrderDates.length - 1]})** se solapa con los siguientes pedidos ya registrados para este DNI:</p>

            <h6 className="mt-3 mb-2">Pedidos en Conflicto (Serán Anulados/Reemplazados):</h6>
            {conflictingPedidos.length === 0 ? (
              <p className="text-center text-muted">No se encontraron pedidos en conflicto.</p>
            ) : (
              <ul className="list-group mb-3">
                {conflictingPedidos.map(pedido => (
                  <li key={pedido.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Fecha:</strong> {pedido.fechaServicio} <br />
                      <strong>Comidas:</strong> {pedido.comidas}
                    </div>
                    <span className={`badge bg-${pedido.estadoPedido === 'Pendiente' ? 'warning' : pedido.estadoPedido === 'Entregado' ? 'success' : 'danger'}`}>
                      {pedido.estadoPedido}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="fw-bold">¿Deseas reemplazar estos pedidos existentes con tu nueva selección?</p>
            <p className="text-muted small">Al confirmar, los pedidos listados arriba serán anulados y se registrarán los nuevos pedidos para las fechas seleccionadas.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
            <button type="button" className="btn btn-warning" onClick={onConfirmReplace}>Sí, Reemplazar Pedidos</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplaceConfirmationModal;