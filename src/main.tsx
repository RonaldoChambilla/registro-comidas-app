import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importa los estilos CSS de Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Importa el bundle JS de Bootstrap (incluye Popper.js)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);