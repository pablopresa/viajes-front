export interface ItinerarioItem {
  id: number;
  tipo: 'ACTIVIDAD' | 'TRAYECTO';
  nombre: string;
  descripcion?: string;
  inicio: Date;
  fin: Date;
  duracionMinutos: number;
  ubicacion?: string;
  origen?: string;
  destino?: string;
  costo?: number;
  costoEstimado?: number;
  medioTransporte?: string;
  adjuntoId?: number;
  distanciaKms?: number;
}
