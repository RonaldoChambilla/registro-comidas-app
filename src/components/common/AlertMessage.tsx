import React from 'react';
import { Alert } from 'react-bootstrap';

interface AlertMessageProps {
  show: boolean;
  message: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  onClose: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ show, message, variant = 'info', onClose }) => {
  if (!show) return null;

  return (
    <Alert variant={variant} dismissible onClose={onClose}>
      {message}
    </Alert>
  );
};

export default AlertMessage;