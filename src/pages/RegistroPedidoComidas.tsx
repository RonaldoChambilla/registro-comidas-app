import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Form,
  Button,
} from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays } from 'date-fns';

import FormDni from '../components/common/FormDni';
import PedidoForm from '../components/common/PedidoForm';
import HistorialPedidos from '../components/common/HistorialPedidos';
import AlertMessage from '../components/common/AlertMessage';
import ReplaceConfirmationModal from '../components/common/ReplaceConfirmationModal';

import { formatDateForDisplay, getMealDisplayName, getLocationDisplayName } from '../utils/formatters';

import {
  registerOrder,
  updateOrderStatus,
  getWorkerOrders,
  patchOrderReplacement,
} from '../services/orderService';
import {
  validateDni} from '../services/employeeApi';

import {
      getLugaresEntrega,
  getTiposComida,
} from '../services/dataService'
import type {
  Pedido,
  TipoComida,
  LugarEntrega,
  ConflictingPedidoSummary,
  RegisterOrderRequest,
  EmployeeValidationResponse
} from '../types';

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
  const [alertVariant, setAlertVariant] = useState<'success' | 'danger'>('danger');
  const [alertMessage, setAlertMessage] = useState('');

  const [historialPedidos, setHistorialPedidos] = useState<Pedido[]>([]);

  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [conflictingPedidosSummary, setConflictingPedidosSummary] = useState<ConflictingPedidoSummary[]>([]);
  const [newOrderDatesForConflict, setNewOrderDatesForConflict] = useState<string[]>([]);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const displayAlert = useCallback((message: string, variant: 'success' | 'danger') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  }, []);

  const loadHistorialPedidos = useCallback(async () => {
    if (idTrabajador && dni && nombres) {
      try {
        const pedidos = await getWorkerOrders(idTrabajador, dni, nombres);
        pedidos.sort((a, b) => new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime());
        setHistorialPedidos(pedidos);
      } catch (error) {
        console.error('Error al cargar historial de pedidos:', error);
        displayAlert('Error al cargar el historial de pedidos.', 'danger');
      }
    }
  }, [idTrabajador, dni, nombres, displayAlert]);

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadHistorialPedidos();
  }, [loadHistorialPedidos]);

  const handleDniValidation = async () => {
    setShowAlert(false);
    if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
      displayAlert('El DNI debe contener 8 dígitos numéricos.', 'danger');
      return;
    }

    try {
      const data: EmployeeValidationResponse | null = await validateDni(dni);
      if (data) {
        setNombres(data.nombres);
        setIdTrabajador(data.idTrabajador);
        setIdCliente(data.idCliente);
        setFormDisabled(false);
        displayAlert('DNI validado con éxito. Puede continuar con el pedido.', 'success');
      } else {
        setNombres('');
        setFormDisabled(true);
        displayAlert('DNI no encontrado o inválido.', 'danger');
      }
    } catch (error) {
      console.error('Error en la validación del DNI:', error);
      displayAlert('Error al validar el DNI.', 'danger');
    }
  };

  const validateForm = () => {
    if (!fechaIngreso || !fechaSalida) {
      displayAlert('Ingrese fechas válidas.', 'danger');
      return false;
    }
    if (fechaIngreso > fechaSalida) {
      displayAlert('La fecha de salida no puede ser anterior a la de ingreso.', 'danger');
      return false;
    }
    const hasMeal = desayunoSeleccionado || almuerzoSeleccionado || cenaSeleccionada;
    if (!hasMeal) {
      displayAlert('Debe seleccionar al menos una comida.', 'danger');
      return false;
    }
    if (desayunoSeleccionado && !lugarEntregaDesayuno) {
      displayAlert('Seleccione lugar de entrega para el desayuno.', 'danger');
      return false;
    }
    if (almuerzoSeleccionado && !lugarEntregaAlmuerzo) {
      displayAlert('Seleccione lugar de entrega para el almuerzo.', 'danger');
      return false;
    }
    if (cenaSeleccionada && !lugarEntregaCena) {
      displayAlert('Seleccione lugar de entrega para la cena.', 'danger');
      return false;
    }
    return true;
  };

  const buildOrderRequest = (): RegisterOrderRequest => ({
    IdTrabajador: idTrabajador!,
    IdCliente: idCliente!,
    FechaIngreso: fechaIngreso ? format(fechaIngreso, 'yyyy-MM-dd') : '',
    FechaSalida: fechaSalida ? format(fechaSalida, 'yyyy-MM-dd') : '',
    IdProductoDesayuno: desayunoSeleccionado || undefined,
    IdProductoAlmuerzo: almuerzoSeleccionado || undefined,
    IdProductoCena: cenaSeleccionada || undefined,
    IdLugarEntregaDesayuno: desayunoSeleccionado && lugarEntregaDesayuno || undefined,
    IdLugarEntregaAlmuerzo: almuerzoSeleccionado && lugarEntregaAlmuerzo || undefined,
    IdLugarEntregaCena: cenaSeleccionada && lugarEntregaCena || undefined,
  });

  const resetForm = () => {
    setFechaIngreso(null);
    setFechaSalida(null);
    setDesayunoSeleccionado('');
    setAlmuerzoSeleccionado('');
    setCenaSeleccionada('');
    setLugarEntregaDesayuno('');
    setLugarEntregaAlmuerzo('');
    setLugarEntregaCena('');
    setIsFormSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitted(true);
    if (!validateForm()) return;

    try {
        const orderRequest = buildOrderRequest();
        console.log('Enviando al backend:', orderRequest);
      const response = await registerOrder(orderRequest);
      if (response && response.conflictos) {
        const resumen = response.conflictos.map((c: any) => ({
          id: uuidv4(),
          fechaServicio: c.fecha,
          comidas: Object.entries(c.productos)
            .map(([k, v]: any) => `${k}: ${v.nombre}`)
            .join(', '),
           estadoPedido: 'Pendiente' as 'Pendiente',
        }));
        setConflictingPedidosSummary(resumen);

        const fechas: string[] = [];
        let fechaActual = new Date(fechaIngreso!);
        while (fechaActual <= fechaSalida!) {
          fechas.push(format(fechaActual, 'yyyy-MM-dd'));
          fechaActual = addDays(fechaActual, 1);
        }
        setNewOrderDatesForConflict(fechas);
        setShowReplaceModal(true);
      } else {
        displayAlert('Pedido registrado con éxito.', 'success');
        resetForm();
        loadHistorialPedidos();
      }
    } catch (error: any) {
  if (error?.conflictos) {
    const resumen = error.conflictos.map((c: any) => ({
      id: uuidv4(),
      fechaServicio: c.fecha,
      comidas: Object.entries(c.productos)
        .map(([k, v]: any) => `${k}: ${v.nombre}`)
        .join(', '),
      estadoPedido: 'Pendiente' as 'Pendiente',
    }));
    setConflictingPedidosSummary(resumen);

    const fechas: string[] = [];
    let fechaActual = new Date(fechaIngreso!);
    while (fechaActual <= fechaSalida!) {
      fechas.push(format(fechaActual, 'yyyy-MM-dd'));
      fechaActual = addDays(fechaActual, 1);
    }
    setNewOrderDatesForConflict(fechas);
    setShowReplaceModal(true);
  } else {
    displayAlert(error.message || 'Error inesperado.', 'danger');
  }
}
  };

  const handleConfirmReplace = async () => {
    try {
      await patchOrderReplacement(idTrabajador!, buildOrderRequest());
      displayAlert('Pedidos reemplazados con éxito.', 'success');
      resetForm();
      loadHistorialPedidos();
    } catch (error: any) {
      displayAlert(error.message || 'Error al reemplazar pedidos.', 'danger');
    }
    setShowReplaceModal(false);
  };

  const handlePedidoAnular = async (id: string) => {
    if (!window.confirm('¿Anular este pedido?')) return;
    try {
      await updateOrderStatus(parseInt(id), 2);
      displayAlert('Pedido anulado.', 'success');
      loadHistorialPedidos();
    } catch (e: any) {
      displayAlert(e.message, 'danger');
    }
  };

  const handlePedidoRecibido = async (id: string) => {
    if (!window.confirm('¿Marcar como entregado?')) return;
    try {
      await updateOrderStatus(parseInt(id), 2);
      displayAlert('Pedido entregado (anulado en backend).', 'success');
      loadHistorialPedidos();
    } catch (e: any) {
      displayAlert(e.message, 'danger');
    }
  };

  return (
    <Container className="my-4">
      <h1 className="mb-4 text-center">Registro de Pedido de Comidas</h1>

      <AlertMessage
        show={showAlert}
        message={alertMessage}
        variant={alertVariant}
        onClose={() => setShowAlert(false)}
      />

      <Form onSubmit={(e) => e.preventDefault()}>
        <FormDni
          dni={dni}
          nombres={nombres}
          onDniChange={setDni}
          onValidate={handleDniValidation}
        />

        <hr />

        <fieldset disabled={formDisabled}>
          <PedidoForm
            fechaIngreso={fechaIngreso}
            fechaSalida={fechaSalida}
            setFechaIngreso={setFechaIngreso}
            setFechaSalida={setFechaSalida}
            desayunoSeleccionado={desayunoSeleccionado}
            almuerzoSeleccionado={almuerzoSeleccionado}
            cenaSeleccionada={cenaSeleccionada}
            setDesayunoSeleccionado={setDesayunoSeleccionado}
            setAlmuerzoSeleccionado={setAlmuerzoSeleccionado}
            setCenaSeleccionada={setCenaSeleccionada}
            lugarEntregaDesayuno={lugarEntregaDesayuno}
            lugarEntregaAlmuerzo={lugarEntregaAlmuerzo}
            lugarEntregaCena={lugarEntregaCena}
            setLugarEntregaDesayuno={setLugarEntregaDesayuno}
            setLugarEntregaAlmuerzo={setLugarEntregaAlmuerzo}
            setLugarEntregaCena={setLugarEntregaCena}
            lugaresEntrega={lugaresEntrega}
            tiposComida={tiposComida}
            isFormSubmitted={isFormSubmitted}
          />

          <Button variant="success" type="submit" onClick={handleSubmit} className="mt-4">
            Registrar Pedido
          </Button>
        </fieldset>
      </Form>

      <HistorialPedidos
        pedidos={historialPedidos}
        nombres={nombres}
        tiposComida={tiposComida}
        lugaresEntrega={lugaresEntrega}
        onAnular={handlePedidoAnular}
        onRecibido={handlePedidoRecibido}
      />

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