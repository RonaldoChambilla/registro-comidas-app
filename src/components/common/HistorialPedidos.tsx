import React from 'react';
import { ListGroup, Row, Col, Button, Alert } from 'react-bootstrap';
import type { Pedido, TipoComida, LugarEntrega } from '../../types';
import { formatDateForDisplay, getMealDisplayName, getLocationDisplayName } from '../../utils/formatters';

interface HistorialPedidosProps {
  pedidos: Pedido[];
  nombres: string;
  tiposComida: TipoComida[];
  lugaresEntrega: LugarEntrega[];
  onAnular: (pedidoId: string) => void;
  onRecibido: (pedidoId: string) => void;
}

const HistorialPedidos: React.FC<HistorialPedidosProps> = ({
  pedidos,
  nombres,
  tiposComida,
  lugaresEntrega,
  onAnular,
  onRecibido,
}) => {
  if (pedidos.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        No hay pedidos registrados para este empleado.
      </Alert>
    );
  }

  return (
    <>
      <h2 className="mt-5 mb-3 text-center">Historial de Pedidos de {nombres}</h2>
      <ListGroup className="mt-3">
        {pedidos.map((pedido) => (
          <ListGroup.Item key={pedido.id} className="mb-2">
            <Row className="align-items-center">
              <Col md={3}>
                <strong>Fecha:</strong> {formatDateForDisplay(pedido.fechaServicio)}
              </Col>
              <Col md={4}>
                <div>
                  <strong>Desayuno:</strong>{' '}
                  {getMealDisplayName(pedido.desayuno?.tipoId, tiposComida)} (
                  {getLocationDisplayName(pedido.desayuno?.lugarEntregaId, lugaresEntrega)})
                </div>
                <div>
                  <strong>Almuerzo:</strong>{' '}
                  {getMealDisplayName(pedido.almuerzo?.tipoId, tiposComida)} (
                  {getLocationDisplayName(pedido.almuerzo?.lugarEntregaId, lugaresEntrega)})
                </div>
                <div>
                  <strong>Cena:</strong>{' '}
                  {getMealDisplayName(pedido.cena?.tipoId, tiposComida)} (
                  {getLocationDisplayName(pedido.cena?.lugarEntregaId, lugaresEntrega)})
                </div>
              </Col>
              <Col md={3}>
                <strong>Estado:</strong> {pedido.estadoPedido}
                <br />
                <strong>Reg. Activo:</strong> {pedido.estadoRegistro}
              </Col>
              <Col md={2} className="d-flex justify-content-end">
                {pedido.estadoPedido === 'Pendiente' && pedido.estadoRegistro === 'Activo' && (
                  <>
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2"
                      onClick={() => onRecibido(pedido.id)}
                    >
                      Entregado
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => onAnular(pedido.id)}
                    >
                      Anular
                    </Button>
                  </>
                )}
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default HistorialPedidos;