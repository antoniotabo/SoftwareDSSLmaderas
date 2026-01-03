export interface Cliente {
  id?: number;
  razon_social: string;
  ruc?: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ClienteResponse {
  success: boolean;
  data?: Cliente | Cliente[];
  message?: string;
  mensaje?: string;
}