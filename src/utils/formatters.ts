import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TipoComida, LugarEntrega } from '../types';

export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';
  } catch (e) {
    return 'Fecha inválida';
  }
};

export const getMealDisplayName = (id: number | undefined, comidas: TipoComida[]): string => {
  if (!id) return 'Ninguno';
  const comida = comidas.find(c => c.id === id);
  return comida ? comida.nombre : 'Desconocido';
};

export const getLocationDisplayName = (id: number | undefined, lugares: LugarEntrega[]): string => {
  if (!id) return 'Ninguno';
  const lugar = lugares.find(l => l.id === id);
  return lugar ? lugar.nombre : 'Desconocido';
};