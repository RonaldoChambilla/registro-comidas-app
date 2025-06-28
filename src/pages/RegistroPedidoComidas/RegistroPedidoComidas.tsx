import React, { useState, useEffect } from 'react';
import { validateDni } from '../../services/employeeApi';
import { getLugaresEntrega, getTiposComida } from '../../services/dataService';
import { getDatesInRange, formatDateToYYYYMMDD, parseDateYYYYMMDD } from '../../utils/dateUtils'; // Importar utilidades de fecha
import type { EmployeeValidationResponse, LugarEntrega, TipoComida, Pedido, ComidaSeleccionada, ConflictingPedidoSummary, ReplaceConfirmationModalProps } from '../../types'; // Importar nuevas interfaces
import PedidosModal from '../../components/common/PedidosModal';
import ReplaceConfirmationModal from '../../components/common/ReplaceConfirmationModal';
// Importa el nuevo modal de confirmación de reemplazo, que crearemos a continuación
// import ReplaceConfirmationModal from '../../components/common/ReplaceConfirmationModal';


const RegistroPedidoComidas: React.FC = () => {
  const [dni, setDni] = useState<string>('');
  const [nombres, setNombres] = useState<string>('');
  const [dniValidated, setDniValidated] = useState<boolean>(false);
  const [dniError, setDniError] = useState<string | null>(null);

  const [fechaIngreso, setFechaIngreso] = useState<string>('');
  const [fechaSalida, setFechaSalida] = useState<string>('');

  const [opcionesComida, setOpcionesComida] = useState<TipoComida[]>([]);
  const [lugaresEntrega, setLugaresEntrega] = useState<LugarEntrega[]>([]);

  const [desayunoOpcion, setDesayunoOpcion] = useState<string>('');
  const [desayunoLugar, setDesayunoLugar] = useState<string>('');
  const [almuerzoOpcion, setAlmuerzoOpcion] = useState<string>('');
  const [almuerzoLugar, setAlmuerzoLugar] = useState<string>('');
  const [cenaOpcion, setCenaOpcion] = useState<string>('');
  const [cenaLugar, setCenaLugar] = useState<string>('');

  // Estados para el modal de pedidos
  const [showPedidosModal, setShowPedidosModal] = useState<boolean>(false);
  const [historialPedidos, setHistorialPedidos] = useState<Pedido[]>([]);

  // Estados para el modal de confirmación de reemplazo
  const [showReplaceConfirmationModal, setShowReplaceConfirmationModal] = useState<boolean>(false);
  const [conflictingPedidosSummary, setConflictingPedidosSummary] = useState<ConflictingPedidoSummary[]>([]);
  const [newOrderDatesToConfirm, setNewOrderDatesToConfirm] = useState<string[]>([]); // Fechas que se intentarían registrar

  // Simular carga de datos para los selectores
  useEffect(() => {
    const loadData = async () => {
      const loadedLugares = await getLugaresEntrega();
      const loadedTiposComida = await getTiposComida();
      setLugaresEntrega(loadedLugares);
      setOpcionesComida(loadedTiposComida);
    };
    loadData();
  }, []);

  // Simular la carga de historial de pedidos al validar el DNI
  useEffect(() => {
    if (dniValidated && dni) {
      // Simulación: cargar pedidos asociados al DNI validado
      const simulatedPedidosData: Pedido[] = [
        // Pedido original de 2 días para Juan Perez
        {
          id: 'PED001-2025-07-01',
          dni: '22334455',
          nombres: 'kiwichon',
          fechaServicio: '2025-07-01',
          desayuno: { tipoId: 1, tipoNombre: 'Normal', lugarEntregaId: 1, lugarEntregaNombre: 'Mina' } as ComidaSeleccionada,
          almuerzo: { tipoId: 2, tipoNombre: 'Dieta', lugarEntregaId: 2, lugarEntregaNombre: 'Almacen' } as ComidaSeleccionada,
          cena: { tipoId: 3, tipoNombre: 'Frio', lugarEntregaId: 3, lugarEntregaNombre: 'Hotel' } as ComidaSeleccionada,
          fechaHoraRegistro: '2025-06-25T10:00:00Z',
          estadoPedido: 'Pendiente',
          estadoRegistro: 'Activo',
        } as Pedido,
        {
          id: 'PED001-2025-07-02',
          dni: '22334455',
          nombres: 'kiwichon',
          fechaServicio: '2025-07-02',
          desayuno: { tipoId: 1, tipoNombre: 'Normal', lugarEntregaId: 1, lugarEntregaNombre: 'Mina' } as ComidaSeleccionada,
          almuerzo: { tipoId: 2, tipoNombre: 'Dieta', lugarEntregaId: 2, lugarEntregaNombre: 'Almacen' } as ComidaSeleccionada,
          cena: { tipoId: 3, tipoNombre: 'Frio', lugarEntregaId: 3, lugarEntregaNombre: 'Hotel' } as ComidaSeleccionada,
          fechaHoraRegistro: '2025-06-25T10:00:00Z',
          estadoPedido: 'Pendiente',
          estadoRegistro: 'Activo',
        } as Pedido,
        // Otro pedido de un día para Juan Perez (ya entregado)
        {
            id: 'PED002-2025-06-24',
            dni: '22334455',
            nombres: 'kiwichon',
            fechaServicio: '2025-06-24',
            desayuno: { tipoId: 1, tipoNombre: 'Normal', lugarEntregaId: 1, lugarEntregaNombre: 'Mina' } as ComidaSeleccionada,
            fechaHoraRegistro: '2025-06-24T15:30:00Z',
            estadoPedido: 'Entregado',
            estadoRegistro: 'Activo',
        } as Pedido,
        // Pedido de un día para Maria Lopez (anulado)
        {
            id: 'PED003-2025-06-20',
            dni: '87654321', // DNI diferente
            nombres: 'Maria Lopez',
            fechaServicio: '2025-06-20',
            almuerzo: { tipoId: 1, tipoNombre: 'Normal', lugarEntregaId: 2, lugarEntregaNombre: 'Almacen' } as ComidaSeleccionada,
            fechaHoraRegistro: '2025-06-20T08:45:00Z',
            estadoPedido: 'Anulado',
            estadoRegistro: 'Eliminado',
        } as Pedido,
        // Pedido que conflictua con el anterior para 12345678
        {
          id: 'PED004-2025-07-01',
          dni: '22334455',
          nombres: 'kiwichon',
          fechaServicio: '2025-07-01',
          desayuno: { tipoId: 1, tipoNombre: 'Normal', lugarEntregaId: 1, lugarEntregaNombre: 'Mina' } as ComidaSeleccionada,
          fechaHoraRegistro: '2025-06-28T09:00:00Z',
          estadoPedido: 'Pendiente',
          estadoRegistro: 'Activo',
        } as Pedido,
      ].filter(pedido => pedido.dni === dni);

      setHistorialPedidos(simulatedPedidosData);
    } else {
      setHistorialPedidos([]);
    }
  }, [dniValidated, dni]);

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDni(value);
    setDniError(null);
    setDniValidated(false);
    setNombres('');
  };

  const handleValidateDni = async () => {
    // ... (validaciones de DNI existentes)
    setDniError(null);
    const employeeData: EmployeeValidationResponse | null = await validateDni(dni);

    if (employeeData && employeeData.nombres) {
      setNombres(employeeData.nombres);
      setDniValidated(true);
      // Aquí, si la API real devolviera los pedidos, los cargaríamos.
      // Por ahora, el useEffect se encarga de la simulación.
    } else {
      setDniError("El DNI ingresado no corresponde a ningún empleado registrado.");
      setDniValidated(false);
      setNombres('');
    }
  };

  const handleShowPedidosModal = () => setShowPedidosModal(true);
  const handleClosePedidosModal = () => setShowPedidosModal(false);

  // Funciones para manejar estado del modal de reemplazo
  const handleShowReplaceConfirmationModal = () => setShowReplaceConfirmationModal(true);
  const handleCloseReplaceConfirmationModal = () => setShowReplaceConfirmationModal(false);

  const handlePedidoRecibido = (id: string) => {
    console.log(`Pedido ${id} marcado como Recibido`);
    setHistorialPedidos(prevPedidos =>
      prevPedidos.map(pedido =>
        pedido.id === id
          ? { ...pedido, estadoPedido: 'Entregado' } as Pedido // <--- CAMBIO AQUÍ: Casting explícito
          : pedido
      )
    );
    alert(`Pedido ${id} marcado como Recibido.`);
  };

  const handlePedidoCancelar = (id: string) => {
    console.log(`Pedido ${id} marcado como Anulado`);
    setHistorialPedidos(prevPedidos =>
      prevPedidos.map(pedido =>
        pedido.id === id
          ? { ...pedido, estadoPedido: 'Anulado', estadoRegistro: 'Eliminado' } as Pedido // <--- CAMBIO AQUÍ: Casting explícito
          : pedido
      )
    );
    alert(`Pedido ${id} Cancelado.`);
  };

  const handleConfirmReplace = () => {
    console.log("Confirmado el reemplazo de pedidos. Se eliminan los anteriores y se registran los nuevos.");
    // Aquí iría la lógica para "eliminar" los pedidos existentes y luego registrar los nuevos.
    // Por ahora, simularemos la anulación de los pedidos en conflicto y la adición de los nuevos.

    const datesToRegister = newOrderDatesToConfirm.map(parseDateYYYYMMDD);
    const initialFechaHoraRegistro = new Date().toISOString();

    const newDailyPedidos: Pedido[] = datesToRegister.map(date => {
      return {
        id: `${dni}-${formatDateToYYYYMMDD(date)}-${Date.now()}`, // ID único para cada pedido diario
        dni,
        nombres,
        fechaServicio: formatDateToYYYYMMDD(date),
        desayuno: desayunoOpcion && desayunoLugar ? { tipoId: opcionesComida.find(o => o.nombre === desayunoOpcion)?.id || 0, tipoNombre: desayunoOpcion, lugarEntregaId: lugaresEntrega.find(l => l.nombre === desayunoLugar)?.id || 0, lugarEntregaNombre: desayunoLugar } as ComidaSeleccionada : undefined,
        almuerzo: almuerzoOpcion && almuerzoLugar ? { tipoId: opcionesComida.find(o => o.nombre === almuerzoOpcion)?.id || 0, tipoNombre: almuerzoOpcion, lugarEntregaId: lugaresEntrega.find(l => l.nombre === almuerzoLugar)?.id || 0, lugarEntregaNombre: almuerzoLugar } as ComidaSeleccionada : undefined,
        cena: cenaOpcion && cenaLugar ? { tipoId: opcionesComida.find(o => o.nombre === cenaOpcion)?.id || 0, tipoNombre: cenaOpcion, lugarEntregaId: lugaresEntrega.find(l => l.nombre === cenaLugar)?.id || 0, lugarEntregaNombre: cenaLugar } as ComidaSeleccionada : undefined,
        fechaHoraRegistro: initialFechaHoraRegistro,
        estadoPedido: 'Pendiente', // 'Pendiente' es literal, pero el casting general ayuda
        estadoRegistro: 'Activo',  // 'Activo' es literal, pero el casting general ayuda
      } as Pedido; // <--- Se mantiene este casting para asegurar el tipo completo del nuevo pedido
    });

    setHistorialPedidos(prevPedidos => {
      // Anular los pedidos en conflicto (marcarlos como Anulado/Eliminado)
      const updatedPedidos = prevPedidos.map(pedido => {
        if (conflictingPedidosSummary.some(conflict => conflict.id === pedido.id)) {
          return { ...pedido, estadoPedido: 'Anulado', estadoRegistro: 'Eliminado' } as Pedido; // <--- CAMBIO AQUÍ: Casting explícito
        }
        return pedido;
      });
      // Añadir los nuevos pedidos diarios
      return [...updatedPedidos, ...newDailyPedidos];
    });

    handleCloseReplaceConfirmationModal();
    alert('Pedidos reemplazados y registrados con éxito!');
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de fechas (ahora con el nuevo formato y utilidades)
    if (!fechaIngreso || !fechaSalida) {
        alert("Las fechas de ingreso y salida no pueden estar vacías.");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ingresoDate = parseDateYYYYMMDD(fechaIngreso);
    const salidaDate = parseDateYYYYMMDD(fechaSalida);


    if (ingresoDate < today) {
        alert("La fecha de ingreso debe ser desde hoy en adelante.");
        return;
    }

    if (salidaDate < today) {
        alert("La fecha de salida debe ser desde hoy en adelante.");
        return;
    }

    if (ingresoDate > salidaDate) {
        alert("La fecha de salida no puede ser anterior a la fecha de ingreso.");
        return;
    }

    // Generar las fechas diarias del nuevo pedido
    const datesToRegister = getDatesInRange(ingresoDate, salidaDate).map(formatDateToYYYYMMDD);

    // Validación de conflictos (con la nueva lógica de pedidos diarios)
    const conflictingPedidos: Pedido[] = [];
    datesToRegister.forEach(newDateStr => {
      const newDate = parseDateYYYYMMDD(newDateStr);
      historialPedidos.forEach(existingPedido => {
        if (existingPedido.dni === dni && existingPedido.estadoRegistro === 'Activo') {
          const existingDate = parseDateYYYYMMDD(existingPedido.fechaServicio);
          // Verificar si la fecha del nuevo pedido es la misma que la de un pedido existente activo
          if (newDate.getTime() === existingDate.getTime()) {
            conflictingPedidos.push(existingPedido);
          }
        }
      });
    });

    if (conflictingPedidos.length > 0) {
        // Preparar resumen para el modal de advertencia
        const summary: ConflictingPedidoSummary[] = conflictingPedidos.map(p => ({
            id: p.id,
            fechaServicio: p.fechaServicio,
            comidas: `${p.desayuno?.tipoNombre ? 'Desayuno: ' + p.desayuno.tipoNombre : ''}${p.almuerzo?.tipoNombre ? (p.desayuno ? ', ' : '') + 'Almuerzo: ' + p.almuerzo.tipoNombre : ''}${p.cena?.tipoNombre ? (p.desayuno || p.almuerzo ? ', ' : '') + 'Cena: ' + p.cena.tipoNombre : ''}` || 'Sin comidas',
            estadoPedido: p.estadoPedido,
        }));
        setConflictingPedidosSummary(summary);
        setNewOrderDatesToConfirm(datesToRegister); // Guardar las fechas del nuevo pedido
        handleShowReplaceConfirmationModal(); // Mostrar el modal de confirmación
        return;
    }

    // Si no hay conflictos, proceder con el registro normal
    const initialFechaHoraRegistro = new Date().toISOString();
    const newDailyPedidos: Pedido[] = datesToRegister.map(dateStr => {
        return {
            id: `${dni}-${dateStr}-${Date.now()}`, // ID único para cada pedido diario
            dni,
            nombres,
            fechaServicio: dateStr,
            desayuno: desayunoOpcion && desayunoLugar ? { tipoId: opcionesComida.find(o => o.nombre === desayunoOpcion)?.id || 0, tipoNombre: desayunoOpcion, lugarEntregaId: lugaresEntrega.find(l => l.nombre === desayunoLugar)?.id || 0, lugarEntregaNombre: desayunoLugar } : undefined,
            almuerzo: almuerzoOpcion && almuerzoLugar ? { tipoId: opcionesComida.find(o => o.nombre === almuerzoOpcion)?.id || 0, tipoNombre: almuerzoOpcion, lugarEntregaId: lugaresEntrega.find(l => l.nombre === almuerzoLugar)?.id || 0, lugarEntregaNombre: almuerzoLugar } : undefined,
            cena: cenaOpcion && cenaLugar ? { tipoId: opcionesComida.find(o => o.nombre === cenaOpcion)?.id || 0, tipoNombre: cenaOpcion, lugarEntregaId: lugaresEntrega.find(l => l.nombre === cenaLugar)?.id || 0, lugarEntregaNombre: cenaLugar } : undefined,
            fechaHoraRegistro: initialFechaHoraRegistro,
            estadoPedido: 'Pendiente',
            estadoRegistro: 'Activo',
        } as Pedido;
    });

    setHistorialPedidos(prevPedidos => [...prevPedidos, ...newDailyPedidos]);
    console.log("Pedidos registrados:", newDailyPedidos);
    alert('Pedido registrado con éxito!');

    // Limpiar el formulario después de enviar (opcional)
    // setFechaIngreso('');
    // setFechaSalida('');
    // setDesayunoOpcion('');
    // setDesayunoLugar('');
    // setAlmuerzoOpcion('');
    // setAlmuerzoLugar('');
    // setCenaOpcion('');
    // setCenaLugar('');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card p-4">
            <h1 className="text-center mb-4">Mi pedido</h1>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="dni" className="form-label">DNI</label>
                  <div className="input-group">
                    <input
                      type="text"
                      id="dni"
                      className={`form-control ${dniError ? 'is-invalid' : ''}`}
                      placeholder="Ingresa DNI"
                      value={dni}
                      onChange={handleDniChange}
                      required
                      maxLength={8}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleValidateDni}
                    >
                      Buscar
                    </button>
                    {dniError && <div className="invalid-feedback">{dniError}</div>}
                  </div>
                </div>
                <div className="col-md-8">
                  <label htmlFor="nombres" className="form-label">Nombres</label>
                  <input
                    type="text"
                    id="nombres"
                    className="form-control"
                    placeholder="Nombre completo"
                    value={nombres}
                    readOnly
                    disabled={!dniValidated}
                  />
                </div>

                {/* Botón para ver historial de pedidos, solo visible si el DNI es válido */}
                {dniValidated && (
                  <div className="col-12 text-end">
                    <button
                      type="button"
                      className="btn btn-info btn-sm"
                      onClick={handleShowPedidosModal}
                    >
                      Ver Mis Pedidos
                    </button>
                  </div>
                )}

                {/* Resto del formulario se muestra solo si el DNI es válido */}
                {dniValidated && (
                  <>
                    <div className="col-md-4">
                      <label htmlFor="fechaIngreso" className="form-label">Fecha de Ingreso Laboral</label>
                      <input
                        type="date"
                        id="fechaIngreso"
                        className="form-control"
                        value={fechaIngreso}
                        onChange={(e) => setFechaIngreso(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="fechaSalida" className="form-label">Fecha de Salida Laboral</label>
                      <input
                        type="date"
                        id="fechaSalida"
                        className="form-control"
                        value={fechaSalida}
                        onChange={(e) => setFechaSalida(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="fechaRegistro" className="form-label">Fecha de Registro</label>
                      <input
                        type="text"
                        id="fechaRegistro"
                        className="form-control"
                        value={new Date().toLocaleDateString()}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Desayuno */}
                    <h2 className="mt-4">¿Qué desayuno desea?</h2>
                    <div className="col-md-6">
                      <label htmlFor="opciones_desayuno" className="form-label">Quiero</label>
                      <select
                        id="opciones_desayuno"
                        className="form-select"
                        value={desayunoOpcion}
                        onChange={(e) => setDesayunoOpcion(e.target.value)}
                        required={false}
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        {opcionesComida.map(opcion => (
                          <option key={opcion.id} value={opcion.nombre}>{opcion.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="lugares_entrega_D" className="form-label">Llévalo a</label>
                      <select
                        id="lugares_entrega_D"
                        className="form-select"
                        value={desayunoLugar}
                        onChange={(e) => setDesayunoLugar(e.target.value)}
                        required={false}
                      >
                        <option value="" disabled>Selecciona un lugar</option>
                        {lugaresEntrega.map(lugar => (
                          <option key={lugar.id} value={lugar.nombre}>{lugar.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Almuerzo */}
                    <h2 className="mt-4">¿Qué almuerzo desea?</h2>
                    <div className="col-md-6">
                      <label htmlFor="opciones_almuerzo" className="form-label">Quiero</label>
                      <select
                        id="opciones_almuerzo"
                        className="form-select"
                        value={almuerzoOpcion}
                        onChange={(e) => setAlmuerzoOpcion(e.target.value)}
                        required={false}
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        {opcionesComida.map(opcion => (
                          <option key={opcion.id} value={opcion.nombre}>{opcion.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="lugares_entrega_A" className="form-label">Llévalo a</label>
                      <select
                        id="lugares_entrega_A"
                        className="form-select"
                        value={almuerzoLugar}
                        onChange={(e) => setAlmuerzoLugar(e.target.value)}
                        required={false}
                      >
                        <option value="" disabled>Selecciona un lugar</option>
                        {lugaresEntrega.map(lugar => (
                          <option key={lugar.id} value={lugar.nombre}>{lugar.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Cena */}
                    <h2 className="mt-4">¿Qué cena desea?</h2>
                    <div className="col-md-6">
                      <label htmlFor="opciones_cena" className="form-label">Quiero</label>
                      <select
                        id="opciones_cena"
                        className="form-select"
                        value={cenaOpcion}
                        onChange={(e) => setCenaOpcion(e.target.value)}
                        required={false}
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        {opcionesComida.map(opcion => (
                          <option key={opcion.id} value={opcion.nombre}>{opcion.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="lugares_entrega_C" className="form-label">Llévalo a</label>
                      <select
                        id="lugares_entrega_C"
                        className="form-select"
                        value={cenaLugar}
                        onChange={(e) => setCenaLugar(e.target.value)}
                        required={false}
                      >
                        <option value="" disabled>Selecciona un lugar</option>
                        {lugaresEntrega.map(lugar => (
                          <option key={lugar.id} value={lugar.nombre}>{lugar.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 text-center mt-4">
                      <button type="submit" className="btn btn-primary px-5">Reservar</button>
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Renderizar el modal */}
      <PedidosModal
        show={showPedidosModal}
        onHide={handleClosePedidosModal}
        pedidos={historialPedidos}
        onPedidoRecibido={handlePedidoRecibido}
        onPedidoCancelar={handlePedidoCancelar}
      />
      {/* El nuevo modal de confirmación de reemplazo se renderizará aquí */}
      <ReplaceConfirmationModal
        show={showReplaceConfirmationModal}
        onHide={handleCloseReplaceConfirmationModal}
        onConfirmReplace={handleConfirmReplace}
        conflictingPedidos={conflictingPedidosSummary}
        newOrderDates={newOrderDatesToConfirm}
      />
    </div>
  );
};

export default RegistroPedidoComidas;