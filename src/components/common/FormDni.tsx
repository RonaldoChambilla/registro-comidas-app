import React from 'react';
import { Form, Button, Col, Row } from 'react-bootstrap';

interface FormDniProps {
  dni: string;
  nombres: string;
  onDniChange: (dni: string) => void;
  onValidate: () => void;
}

const FormDni: React.FC<FormDniProps> = ({ dni, nombres, onDniChange, onValidate }) => (
  <Row className="mb-3 align-items-end">
    <Col md={4}>
      <Form.Group controlId="formDni">
        <Form.Label>DNI Empleado</Form.Label>
        <Form.Control
          type="text"
          placeholder="Ingrese DNI"
          value={dni}
          onChange={(e) => onDniChange(e.target.value)}
          maxLength={8}
        />
      </Form.Group>
    </Col>
    <Col md={3}>
      <Button variant="primary" onClick={onValidate}>
        Validar DNI
      </Button>
    </Col>
    <Col md={5}>
      <Form.Group controlId="formNombres">
        <Form.Label>Nombres del Empleado</Form.Label>
        <Form.Control type="text" value={nombres ?? ''} readOnly disabled />
      </Form.Group>
    </Col>
  </Row>
);

export default FormDni;