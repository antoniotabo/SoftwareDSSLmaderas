export interface Transportista {
  id?: number;
  nombre: string;
  ruc?: string;
  contacto?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface TransportistaResponse {
  success: boolean;
  data?: Transportista | Transportista[];
  message?: string;
  mensaje?: string;
}