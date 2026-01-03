export interface Compra {
  id?: number;
  proveedor_id: number;
  proveedor_nombre?: string; // JOIN
  fecha: string;
  tipo_producto?: string;
  cantidad_pt: number;
  precio_pt: number;
  total_compra?: number; // Calculado: cantidad_pt * precio_pt
  anticipo?: number;
  total_pendiente?: number; // Calculado
  estado: 'CANCELADO' | 'PENDIENTE';
}

export interface CompraResponse {
  success: boolean;
  data?: Compra | Compra[];
  message?: string;
  mensaje?: string;
  id?: number;
}