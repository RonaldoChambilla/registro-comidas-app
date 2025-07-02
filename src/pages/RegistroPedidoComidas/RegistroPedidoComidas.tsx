import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Alert,
  ListGroup,
  Modal,
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Importaciones de servicios y tipos actualizados
import { validateDni } from '../../services/employeeApi';
import { getLugaresEntrega, getTiposComida } from '../../services/dataService';
import {
  registerOrder,
  updateOrderStatus,
  getWorkerOrders,
  patchOrderReplacement,
} from '../../services/orderService';
import type {
  Pedido,
  TipoComida,
  LugarEntrega,
  ComidaSeleccionada,
  EmployeeValidationResponse,
  RegisterOrderRequest,
  RegisterOrderConflictResponse,
  ConflictingPedidoSummary,
} from '../../types';
import ReplaceConfirmationModal from '../../components/common/ReplaceConfirmationModal';

const RegistroPedidoComidas: React.FC = () => {
  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [idTrabajador, setIdTrabajador] = useState<number | null>(null);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [formDisabled, setFormDisabled] = useState(true);
  const [fechaIngreso, setFechaIngreso] = useState<Date | null>(null);
  const [fechaSalida, setFechaSalida] = useState<Date | null>(null);

  const [desayunoSeleccionado, setDesayunoSeleccionado] = useState<number | ''>('');
  const [almuerzoSeleccionado, setAlmuerzoSeleccionado] = useState<number | ''>('');
  const [cenaSeleccionada, setCenaSeleccionada] = useState<number | ''>('');

  const [lugarEntregaDesayuno, setLugarEntregaDesayuno] = useState<number | ''>('');
  const [lugarEntregaAlmuerzo, setLugarEntregaAlmuerzo] = useState<number | ''>('');
  const [lugarEntregaCena, setLugarEntregaCena] = useState<number | ''>('');

  const [lugaresEntrega, setLugaresEntrega] = useState<LugarEntrega[]>([]);
  const [tiposComida, setTiposComida] = useState<TipoComida[]>([]);

  const [showAlert, setShowAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('danger');
  const [alertMessage, setAlertMessage] = useState('');

  const [historialPedidos, setHistorialPedidos] = useState<Pedido[]>([]);

  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [conflictingPedidosSummary, setConflictingPedidosSummary] = useState<ConflictingPedidoSummary[]>([]);
  const [newOrderDatesForConflict, setNewOrderDatesForConflict] = useState<string[]>([]);

  const [isFormSubmitted, setIsFormSubmitted] = useState(false); // Nuevo estado para controlar la validación al enviar

  // Función para mostrar alertas
  const displayAlert = useCallback((message: string, variant: 'success' | 'danger') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  }, []);

  // Cargar lugares de entrega y tipos de comida al inicio
  useEffect(() => {
    const loadData = async () => {
      try {
        const lugares = await getLugaresEntrega();
        setLugaresEntrega(lugares);
        const comidas = await getTiposComida();
        setTiposComida(comidas);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        displayAlert('Error al cargar datos iniciales.', 'danger');
      }
    };
    loadData();
  }, [displayAlert]);

  // Cargar historial de pedidos cuando idTrabajador esté disponible
  const loadHistorialPedidos = useCallback(async () => {
    if (idTrabajador && dni && nombres) {
      try {
        const pedidos = await getWorkerOrders(idTrabajador, dni, nombres);
        // Ordenar pedidos por fecha de servicio descendente
        pedidos.sort((a, b) => new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime());
        setHistorialPedidos(pedidos);
      } catch (error) {
        console.error('Error al cargar historial de pedidos:', error);
        displayAlert('Error al cargar el historial de pedidos.', 'danger');
      }
    }
  }, [idTrabajador, dni, nombres, displayAlert]);

  useEffect(() => {
    loadHistorialPedidos();
  }, [loadHistorialPedidos]); // Dependencia de loadHistorialPedidos

  // Manejar validación de DNI
  const handleDniValidation = async () => {
    setShowAlert(false);
    if (!dni) {
      displayAlert('Por favor, ingrese un número de DNI.', 'danger');
      return;
    }
    if (dni.length !== 8 || !/^\d+$/.test(dni)) {
      displayAlert('El DNI debe contener 8 dígitos numéricos.', 'danger');
      return;
    }

    try {
      const employeeData: EmployeeValidationResponse | null = await validateDni(dni);
      if (employeeData) {
        setNombres(employeeData.nombres);
        setIdTrabajador(employeeData.idTrabajador);
        setIdCliente(employeeData.idCliente);
        setFormDisabled(false);
        displayAlert('DNI validado con éxito. Puede continuar con el pedido.', 'success');
      } else {
        setNombres('');
        setIdTrabajador(null);
        setIdCliente(null);
        setFormDisabled(true);
        displayAlert('DNI no encontrado o inválido. Por favor, intente con otro DNI.', 'danger');
      }
    } catch (error) {
      console.error('Error en la validación del DNI:', error);
      displayAlert('Ocurrió un error al validar el DNI. Intente de nuevo más tarde.', 'danger');
      setNombres('');
      setIdTrabajador(null);
      setIdCliente(null);
      setFormDisabled(true);
    }
  };

  // Validaciones del formulario
  const validateForm = useCallback(() => {
    if (!fechaIngreso || !fechaSalida) {
      displayAlert('Por favor, ingrese tanto la fecha de ingreso como la de salida.', 'danger');
      return false;
    }
    if (fechaIngreso > fechaSalida) {
      displayAlert('La fecha de salida no puede ser anterior a la fecha de ingreso.', 'danger');
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    if (fechaIngreso < today) {
        displayAlert('La fecha de ingreso no puede ser anterior al día de hoy.', 'danger');
        return false;
    }


    const hasSelectedMeal = desayunoSeleccionado || almuerzoSeleccionado || cenaSeleccionada;
    if (!hasSelectedMeal) {
      displayAlert('Debe seleccionar al menos una comida (desayuno, almuerzo o cena).', 'danger');
      return false;
    }

    if (desayunoSeleccionado && !lugarEntregaDesayuno) {
      displayAlert('Por favor, seleccione un lugar de entrega para el desayuno.', 'danger');
      return false;
    }
    if (almuerzoSeleccionado && !lugarEntregaAlmuerzo) {
      displayAlert('Por favor, seleccione un lugar de entrega para el almuerzo.', 'danger');
      return false;
    }
    if (cenaSeleccionada && !lugarEntregaCena) {
      displayAlert('Por favor, seleccione un lugar de entrega para la cena.', 'danger');
      return false;
    }

    return true;
  }, [
    fechaIngreso,
    fechaSalida,
    desayunoSeleccionado,
    almuerzoSeleccionado,
    cenaSeleccionada,
    lugarEntregaDesayuno,
    lugarEntregaAlmuerzo,
    lugarEntregaCena,
    displayAlert,
  ]);

  // Construir el objeto de solicitud para el backend
  const buildOrderRequest = useCallback((): RegisterOrderRequest => {
    return {
      IdTrabajador: idTrabajador!,
      IdCliente: idCliente!,
      FechaIngreso: fechaIngreso ? format(fechaIngreso, 'yyyy-MM-dd') : '',
      FechaSalida: fechaSalida ? format(fechaSalida, 'yyyy-MM-dd') : '',
      IdProductoDesayuno: desayunoSeleccionado ? desayunoSeleccionado : undefined,
      IdProductoAlmuerzo: almuerzoSeleccionado ? almuerzoSeleccionado : undefined,
      IdProductoCena: cenaSeleccionada ? cenaSeleccionada : undefined,
      IdLugarEntregaDesayuno: desayunoSeleccionado && lugarEntregaDesayuno ? lugarEntregaDesayuno : undefined,
      IdLugarEntregaAlmuerzo: almuerzoSeleccionado && lugarEntregaAlmuerzo ? lugarEntregaAlmuerzo : undefined,
      IdLugarEntregaCena: cenaSeleccionada && lugarEntregaCena ? lugarEntregaCena : undefined,
    };
  }, [
    idTrabajador,
    idCliente,
    fechaIngreso,
    fechaSalida,
    desayunoSeleccionado,
    almuerzoSeleccionado,
    cenaSeleccionada,
    lugarEntregaDesayuno,
    lugarEntregaAlmuerzo,
    lugarEntregaCena,
  ]);

  // Manejar el envío del formulario (POST)
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsFormSubmitted(true); // Indicar que el formulario ha sido enviado
    if (!validateForm()) {
      return;
    }
    if (idTrabajador === null || idCliente === null) {
      displayAlert('Error: DNI del trabajador o cliente no validado.', 'danger');
      return;
    }

    const orderRequest = buildOrderRequest();

    try {
      const response = await registerOrder(orderRequest);

      if (response && 'conflictos' in response) {
        // Es una respuesta de conflicto
        const conflictSummaries: ConflictingPedidoSummary[] = response.conflictos.map(
          (conflict) => {
            let comidas = [];
            if (conflict.productos.desayuno) comidas.push(`Desayuno: ${conflict.productos.desayuno.nombre}`);
            if (conflict.productos.almuerzo) comidas.push(`Almuerzo: ${conflict.productos.almuerzo.nombre}`);
            if (conflict.productos.cena) comidas.push(`Cena: ${conflict.productos.cena.nombre}`);

            return {
              id: uuidv4(), // Generar un ID local para el resumen de conflicto
              fechaServicio: conflict.fecha,
              comidas: comidas.join(', ') || 'No especificado',
              estadoPedido: 'Pendiente', // Asumimos que los conflictos son de pedidos pendientes, o el backend debería especificarlo
            };
          }
        );
        setConflictingPedidosSummary(conflictSummaries);
        const newDates = [];
        if (fechaIngreso && fechaSalida) {
            let currentDate = new Date(fechaIngreso);
            while (currentDate <= fechaSalida) {
                newDates.push(format(currentDate, 'yyyy-MM-dd'));
                currentDate = addDays(currentDate, 1);
            }
        }
        setNewOrderDatesForConflict(newDates);
        setShowReplaceModal(true);
      } else {
        // Registro exitoso
        displayAlert('Pedido registrado con éxito.', 'success');
        resetForm();
        loadHistorialPedidos(); // Recargar historial después del registro
      }
    } catch (error) {
      console.error('Error al registrar el pedido:', error);
      displayAlert(`Error al registrar el pedido: ${error instanceof Error ? error.message : String(error)}`, 'danger');
    }
  };

  // Manejar la confirmación de reemplazo (PATCH)
  const handleConfirmReplace = async () => {
    setShowReplaceModal(false); // Cerrar el modal
    if (idTrabajador === null || idCliente === null) {
        displayAlert('Error: DNI del trabajador o cliente no validado para el reemplazo.', 'danger');
        return;
    }

    const orderRequest = buildOrderRequest();

    try {
      await patchOrderReplacement(idTrabajador, orderRequest); // idTrabajador como parámetro para el PATCH
      displayAlert('Pedidos reemplazados con éxito.', 'success');
      resetForm();
      loadHistorialPedidos(); // Recargar historial después del reemplazo
    } catch (error) {
      console.error('Error al reemplazar pedidos:', error);
      displayAlert(`Error al reemplazar pedidos: ${error instanceof Error ? error.message : String(error)}`, 'danger');
    }
  };

  // Manejar cambio de estado a "Anulado" para un pedido
  const handlePedidoAnular = async (pedidoId: string) => {
    const confirmAnular = window.confirm('¿Está seguro de que desea anular este pedido?');
    if (!confirmAnular) {
      return;
    }
    try {
      // El backend indicó que 2 significa "Anulado"
      await updateOrderStatus(parseInt(pedidoId), 2);
      displayAlert('Pedido anulado con éxito.', 'success');
      loadHistorialPedidos(); // Recargar historial después de anular
    } catch (error) {
      console.error('Error al anular pedido:', error);
      displayAlert(`Error al anular pedido: ${error instanceof Error ? error.message : String(error)}`, 'danger');
    }
  };

  // Manejar cambio de estado a "Entregado" para un pedido (mapeado a Anulado según la indicación del backend)
  const handlePedidoRecibido = async (pedidoId: string) => {
    const confirmRecibido = window.confirm('¿Está seguro de que desea marcar este pedido como entregado?');
    if (!confirmRecibido) {
      return;
    }
    try {
      // Según la indicación del backend, "Entregado" y "Cancelar" significan "Anulado" (estado 2)
      await updateOrderStatus(parseInt(pedidoId), 2);
      displayAlert('Pedido marcado como entregado (anulado en el sistema).', 'success');
      loadHistorialPedidos(); // Recargar historial después de marcar como entregado
    } catch (error) {
      console.error('Error al marcar pedido como entregado:', error);
      displayAlert(`Error al marcar pedido como entregado: ${error instanceof Error ? error.message : String(error)}`, 'danger');
    }
  };


  // Función para resetear el formulario
  const resetForm = () => {
    setFechaIngreso(null);
    setFechaSalida(null);
    setDesayunoSeleccionado('');
    setAlmuerzoSeleccionado('');
    setCenaSeleccionada('');
    setLugarEntregaDesayuno('');
    setLugarEntregaAlmuerzo('');
    setLugarEntregaCena('');
    setIsFormSubmitted(false); // Resetear estado de envío del formulario
  };

  // Función para formatear fechas para mostrar en la interfaz de usuario
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';
    } catch (e) {
      console.error('Error parsing date:', e);
      return 'Fecha inválida';
    }
  };

  const getMealDisplayName = (mealTypeId: number | undefined) => {
    if (!mealTypeId) return 'Ninguno';
    const meal = tiposComida.find(t => t.id === mealTypeId);
    return meal ? meal.nombre : 'Desconocido';
  };

  const getLocationDisplayName = (locationId: number | undefined) => {
    if (!locationId) return 'Ninguno';
    const location = lugaresEntrega.find(l => l.id === locationId);
    return location ? location.nombre : 'Desconocido';
  };

  return (
    <Container className="my-4">
      <h1 className="mb-4 text-center">Registro de Pedido de Comidas</h1>

      {showAlert && (
        <Alert variant={alertVariant} onClose={() => setShowAlert(false)} dismissible>
          {alertMessage}
        </Alert>
      )}

      <Form onSubmit={(e) => e.preventDefault()}>
        <Row className="mb-3 align-items-end">
          <Col md={4}>
            <Form.Group controlId="formDni">
              <Form.Label>DNI Empleado</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                maxLength={8}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Button variant="primary" onClick={handleDniValidation}>
              Validar DNI
            </Button>
          </Col>
          <Col md={5}>
            <Form.Group controlId="formNombres">
              <Form.Label>Nombres del Empleado</Form.Label>
              <Form.Control type="text" value={nombres} readOnly disabled />
            </Form.Group>
          </Col>
        </Row>
        <hr />

        <fieldset disabled={formDisabled}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formFechaIngreso">
                <Form.Label>Fecha de Ingreso</Form.Label>
                <DatePicker
                  selected={fechaIngreso}
                  onChange={(date: Date | null) => setFechaIngreso(date)}
                  dateFormat="dd/MM/yyyy"
                  locale={es}
                  className={`form-control ${isFormSubmitted && !fechaIngreso ? 'is-invalid' : ''}`}
                  placeholderText="Seleccione fecha"
                  minDate={new Date()} // Fecha de ingreso debe ser desde hoy en adelante
                />
                {isFormSubmitted && !fechaIngreso && (
                  <div className="invalid-feedback">Ingrese su fecha de ingreso.</div>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formFechaSalida">
                <Form.Label>Fecha de Salida</Form.Label>
                <DatePicker
                  selected={fechaSalida}
                  onChange={(date: Date | null) => setFechaSalida(date)}
                  dateFormat="dd/MM/yyyy"
                  locale={es}
                  className={`form-control ${isFormSubmitted && !fechaSalida ? 'is-invalid' : ''}`}
                  placeholderText="Seleccione fecha"
                  minDate={fechaIngreso || new Date()} // Fecha de salida debe ser igual o posterior a la de ingreso
                />
                {isFormSubmitted && !fechaSalida && (
                  <div className="invalid-feedback">Ingrese su fecha de salida.</div>
                )}
                 {isFormSubmitted && fechaIngreso && fechaSalida && fechaSalida < fechaIngreso && (
                  <div className="invalid-feedback">La fecha de salida no puede ser anterior a la fecha de ingreso.</div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <h4 className="mt-4 mb-3">Selección de Comidas y Lugares de Entrega</h4>

          {/* Desayuno */}
          <Row className="mb-3 align-items-center">
            <Col md={4}>
              <Form.Group controlId="formDesayuno">
                <Form.Label>Desayuno</Form.Label>
                <Form.Select
                  value={desayunoSeleccionado}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDesayunoSeleccionado(value === '' ? '' : parseInt(value));
                    if (value === '') setLugarEntregaDesayuno(''); // Limpiar lugar si no hay desayuno
                  }}
                  className={isFormSubmitted && desayunoSeleccionado && !lugarEntregaDesayuno ? 'is-invalid' : ''}
                >
                  <option value="">No seleccionar</option>
                  {tiposComida.map((comida) => (
                    <option key={comida.id} value={comida.id}>
                      {comida.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="formLugarDesayuno">
                <Form.Label>Lugar de Entrega Desayuno</Form.Label>
                <Form.Select
                  value={lugarEntregaDesayuno}
                  onChange={(e) => setLugarEntregaDesayuno(parseInt(e.target.value))}
                  disabled={!desayunoSeleccionado}
                  className={isFormSubmitted && desayunoSeleccionado && !lugarEntregaDesayuno ? 'is-invalid' : ''}
                >
                  <option value="">Seleccione lugar</option>
                  {lugaresEntrega.map((lugar) => (
                    <option key={lugar.id} value={lugar.id}>
                      {lugar.nombre}
                    </option>
                  ))}
                </Form.Select>
                {isFormSubmitted && desayunoSeleccionado && !lugarEntregaDesayuno && (
                  <div className="invalid-feedback">Debe seleccionar un lugar para el desayuno.</div>
                )}
              </Form.Group>
            </Col>
          </Row>

          {/* Almuerzo */}
          <Row className="mb-3 align-items-center">
            <Col md={4}>
              <Form.Group controlId="formAlmuerzo">
                <Form.Label>Almuerzo</Form.Label>
                <Form.Select
                  value={almuerzoSeleccionado}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAlmuerzoSeleccionado(value === '' ? '' : parseInt(value));
                    if (value === '') setLugarEntregaAlmuerzo('');
                  }}
                  className={isFormSubmitted && almuerzoSeleccionado && !lugarEntregaAlmuerzo ? 'is-invalid' : ''}
                >
                  <option value="">No seleccionar</option>
                  {tiposComida.map((comida) => (
                    <option key={comida.id} value={comida.id}>
                      {comida.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="formLugarAlmuerzo">
                <Form.Label>Lugar de Entrega Almuerzo</Form.Label>
                <Form.Select
                  value={lugarEntregaAlmuerzo}
                  onChange={(e) => setLugarEntregaAlmuerzo(parseInt(e.target.value))}
                  disabled={!almuerzoSeleccionado}
                  className={isFormSubmitted && almuerzoSeleccionado && !lugarEntregaAlmuerzo ? 'is-invalid' : ''}
                >
                  <option value="">Seleccione lugar</option>
                  {lugaresEntrega.map((lugar) => (
                    <option key={lugar.id} value={lugar.id}>
                      {lugar.nombre}
                    </option>
                  ))}
                </Form.Select>
                {isFormSubmitted && almuerzoSeleccionado && !lugarEntregaAlmuerzo && (
                  <div className="invalid-feedback">Debe seleccionar un lugar para el almuerzo.</div>
                )}
              </Form.Group>
            </Col>
          </Row>

          {/* Cena */}
          <Row className="mb-3 align-items-center">
            <Col md={4}>
              <Form.Group controlId="formCena">
                <Form.Label>Cena</Form.Label>
                <Form.Select
                  value={cenaSeleccionada}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCenaSeleccionada(value === '' ? '' : parseInt(value));
                    if (value === '') setLugarEntregaCena('');
                  }}
                  className={isFormSubmitted && cenaSeleccionada && !lugarEntregaCena ? 'is-invalid' : ''}
                >
                  <option value="">No seleccionar</option>
                  {tiposComida.map((comida) => (
                    <option key={comida.id} value={comida.id}>
                      {comida.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="formLugarCena">
                <Form.Label>Lugar de Entrega Cena</Form.Label>
                <Form.Select
                  value={lugarEntregaCena}
                  onChange={(e) => setLugarEntregaCena(parseInt(e.target.value))}
                  disabled={!cenaSeleccionada}
                  className={isFormSubmitted && cenaSeleccionada && !lugarEntregaCena ? 'is-invalid' : ''}
                >
                  <option value="">Seleccione lugar</option>
                  {lugaresEntrega.map((lugar) => (
                    <option key={lugar.id} value={lugar.id}>
                      {lugar.nombre}
                    </option>
                  ))}
                </Form.Select>
                {isFormSubmitted && cenaSeleccionada && !lugarEntregaCena && (
                  <div className="invalid-feedback">Debe seleccionar un lugar para la cena.</div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Button variant="success" type="submit" onClick={handleSubmit} className="mt-4">
            Registrar Pedido
          </Button>
        </fieldset>
      </Form>

      {/* Historial de Pedidos */}
      <h2 className="mt-5 mb-3 text-center">Historial de Pedidos de {nombres}</h2>
      {historialPedidos.length === 0 ? (
        <Alert variant="info" className="text-center">
          No hay pedidos registrados para este empleado.
        </Alert>
      ) : (
        <ListGroup className="mt-3">
          {historialPedidos.map((pedido) => (
            <ListGroup.Item key={pedido.id} className="mb-2">
              <Row className="align-items-center">
                <Col md={3}>
                  <strong>Fecha:</strong> {formatDateForDisplay(pedido.fechaServicio)}
                </Col>
                <Col md={4}>
                  <div>
                    <strong>Desayuno:</strong>{' '}
                    {getMealDisplayName(pedido.desayuno?.tipoId)} (
                    {getLocationDisplayName(pedido.desayuno?.lugarEntregaId)})
                  </div>
                  <div>
                    <strong>Almuerzo:</strong>{' '}
                    {getMealDisplayName(pedido.almuerzo?.tipoId)} (
                    {getLocationDisplayName(pedido.almuerzo?.lugarEntregaId)})
                  </div>
                  <div>
                    <strong>Cena:</strong>{' '}
                    {getMealDisplayName(pedido.cena?.tipoId)} (
                    {getLocationDisplayName(pedido.cena?.lugarEntregaId)})
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
                        onClick={() => handlePedidoRecibido(pedido.id)}
                      >
                        Entregado
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handlePedidoAnular(pedido.id)}
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
      )}

      {/* Modal de Confirmación de Reemplazo */}
      <ReplaceConfirmationModal
        show={showReplaceModal}
        onHide={() => setShowReplaceModal(false)}
        onConfirmReplace={handleConfirmReplace}
        conflictingPedidos={conflictingPedidosSummary}
        newOrderDates={newOrderDatesForConflict}
      />
    </Container>
  );
};

export default RegistroPedidoComidas;