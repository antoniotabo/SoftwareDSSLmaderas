export interface Proveedor {
  id?: number;
  nombre: string;
  ruc?: string;
  contacto?: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ProveedorResponse {
  success: boolean;
  data?: Proveedor | Proveedor[];
  message?: string;
  mensaje?: string;
}