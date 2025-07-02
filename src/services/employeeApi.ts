import type { EmployeeValidationResponse } from '../types';

const BASE_URL = 'http://localhost:3000/delivery'; 

export const validateDni = async (dni: string): Promise<EmployeeValidationResponse | null> => {
  try {
    const response = await fetch(`${BASE_URL}/validardni?dni=${dni}`);

    if (!response.ok) {
      if (response.status === 404) { 
        return null;
      }
      throw new Error(`Error en la validación del DNI: ${response.statusText}`);
    }

    const data: EmployeeValidationResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error al validar el DNI:", error);
    return null;
  }
};