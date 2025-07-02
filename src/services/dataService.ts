import type { LugarEntrega, TipoComida, GetProductoAlimentosResponse, GetLugarDestinoResponse } from '../types';

export const getLugaresEntrega = async (): Promise<LugarEntrega[]> => {
  try {
    const response = await fetch('http://localhost:3000/lugar-destino');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: GetLugarDestinoResponse[] = await response.json();
    // Mapear la respuesta del backend a nuestra interfaz LugarEntrega
    return data.map(item => ({
      id: item.idLugarDestino,
      nombre: item.nombre.charAt(0).toUpperCase() + item.nombre.slice(1).toLowerCase(), // Capitalizar primera letra
    }));
  } catch (error) {
    console.error("Error al obtener lugares de entrega:", error);
    // Fallback a datos simulados si la llamada API falla
    return [
      { id: 1, nombre: 'Mina' },
      { id: 2, nombre: 'Hotel' },
      { id: 3, nombre: 'Almacen' },
    ];
  }
};

export const getTiposComida = async (): Promise<TipoComida[]> => {
  try {
    const response = await fetch('http://localhost:3000/Producto');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: GetProductoAlimentosResponse[] = await response.json();
    // Mapear la respuesta del backend a nuestra interfaz TipoComida
    return data.map(item => ({
      id: item.IdProducto,
      nombre: item.NombreProducto.charAt(0).toUpperCase() + item.NombreProducto.slice(1).toLowerCase(), // Capitalizar primera letra
    }));
  } catch (error) {
    console.error("Error al obtener tipos de comida:", error);
    // Fallback a datos simulados si la llamada API falla
    return [
      { id: 1, nombre: 'Normal' },
      { id: 2, nombre: 'Frio' },
      { id: 3, nombre: 'Dieta' },
      { id: 4, nombre: 'Especial' },
    ];
  }
};