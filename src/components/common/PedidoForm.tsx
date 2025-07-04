import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import type { LugarEntrega, TipoComida } from '../../types';

interface PedidoFormProps {
  fechaIngreso: Date | null;
  fechaSalida: Date | null;
  setFechaIngreso: (date: Date | null) => void;
  setFechaSalida: (date: Date | null) => void;
  desayunoSeleccionado: number | '';
  almuerzoSeleccionado: number | '';
  cenaSeleccionada: number | '';
  setDesayunoSeleccionado: (val: number | '') => void;
  setAlmuerzoSeleccionado: (val: number | '') => void;
  setCenaSeleccionada: (val: number | '') => void;
  lugarEntregaDesayuno: number | '';
  lugarEntregaAlmuerzo: number | '';
  lugarEntregaCena: number | '';
  setLugarEntregaDesayuno: (val: number | '') => void;
  setLugarEntregaAlmuerzo: (val: number | '') => void;
  setLugarEntregaCena: (val: number | '') => void;
  lugaresEntrega: LugarEntrega[];
  tiposComida: TipoComida[];
  isFormSubmitted: boolean;
}

const PedidoForm: React.FC<PedidoFormProps> = ({
  fechaIngreso,
  fechaSalida,
  setFechaIngreso,
  setFechaSalida,
  desayunoSeleccionado,
  almuerzoSeleccionado,
  cenaSeleccionada,
  setDesayunoSeleccionado,
  setAlmuerzoSeleccionado,
  setCenaSeleccionada,
  lugarEntregaDesayuno,
  lugarEntregaAlmuerzo,
  lugarEntregaCena,
  setLugarEntregaDesayuno,
  setLugarEntregaAlmuerzo,
  setLugarEntregaCena,
  lugaresEntrega,
  tiposComida,
  isFormSubmitted
}) => {
  return (
    <>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="formFechaIngreso">
            <Form.Label>Fecha de Ingreso</Form.Label>
            <DatePicker
              selected={fechaIngreso}
              onChange={setFechaIngreso}
              dateFormat="dd/MM/yyyy"
              locale={es}
              className={`form-control ${isFormSubmitted && !fechaIngreso ? 'is-invalid' : ''}`}
              placeholderText="Seleccione fecha"
              minDate={new Date()}
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
              onChange={setFechaSalida}
              dateFormat="dd/MM/yyyy"
              locale={es}
              className={`form-control ${isFormSubmitted && !fechaSalida ? 'is-invalid' : ''}`}
              placeholderText="Seleccione fecha"
              minDate={fechaIngreso || new Date()}
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

      {[
        {
          label: 'Desayuno',
          comidaSeleccionada: desayunoSeleccionado,
          setComidaSeleccionada: setDesayunoSeleccionado,
          lugarEntrega: lugarEntregaDesayuno,
          setLugarEntrega: setLugarEntregaDesayuno
        },
        {
          label: 'Almuerzo',
          comidaSeleccionada: almuerzoSeleccionado,
          setComidaSeleccionada: setAlmuerzoSeleccionado,
          lugarEntrega: lugarEntregaAlmuerzo,
          setLugarEntrega: setLugarEntregaAlmuerzo
        },
        {
          label: 'Cena',
          comidaSeleccionada: cenaSeleccionada,
          setComidaSeleccionada: setCenaSeleccionada,
          lugarEntrega: lugarEntregaCena,
          setLugarEntrega: setLugarEntregaCena
        }
      ].map(({ label, comidaSeleccionada, setComidaSeleccionada, lugarEntrega, setLugarEntrega }, i) => (
        <Row className="mb-3 align-items-center" key={i}>
          <Col md={4}>
            <Form.Group controlId={`form${label}`}>
              <Form.Label>{label}</Form.Label>
              <Form.Select
                value={comidaSeleccionada}
                onChange={(e) => {
                  const value = e.target.value;
                  setComidaSeleccionada(value === '' ? '' : parseInt(value));
                  if (value === '') setLugarEntrega('');
                }}
                className={isFormSubmitted && comidaSeleccionada && !lugarEntrega ? 'is-invalid' : ''}
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
            <Form.Group controlId={`formLugar${label}`}>
              <Form.Label>Lugar de Entrega {label}</Form.Label>
              <Form.Select
                value={lugarEntrega}
                onChange={(e) => setLugarEntrega(parseInt(e.target.value))}
                disabled={!comidaSeleccionada}
                className={isFormSubmitted && comidaSeleccionada && !lugarEntrega ? 'is-invalid' : ''}
              >
                <option value="">Seleccione lugar</option>
                {lugaresEntrega.map((lugar) => (
                  <option key={lugar.id} value={lugar.id}>
                    {lugar.nombre}
                  </option>
                ))}
              </Form.Select>
              {isFormSubmitted && comidaSeleccionada && !lugarEntrega && (
                <div className="invalid-feedback">Debe seleccionar un lugar para el {label.toLowerCase()}.</div>
              )}
            </Form.Group>
          </Col>
        </Row>
      ))}
    </>
  );
};

export default PedidoForm;