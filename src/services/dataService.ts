import type { LugarEntrega, TipoComida } from '../types';

// Datos simulados para los lugares de entrega
export const getLugaresEntrega = async (): Promise<LugarEntrega[]> => {
  // Simula una llamada a la API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, nombre: 'Mina' },
        { id: 2, nombre: 'Almacen' },
        { id: 3, nombre: 'Hotel' },
      ]);
    }, 100); // Pequeño retardo para simular una red
  });
};

// Datos simulados para los tipos de comida (Normal, Dieta, Frio)
export const getTiposComida = async (): Promise<TipoComida[]> => {
  // Simula una llamada a la API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, nombre: 'Normal' },
        { id: 2, nombre: 'Dieta' },
        { id: 3, nombre: 'Frio' },
      ]);
    }, 100); // Pequeño retardo para simular una red
  });
};