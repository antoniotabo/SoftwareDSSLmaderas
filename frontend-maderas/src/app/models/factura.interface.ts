export interface FacturaItem {
  id?: number;
  factura_id?: number;
  producto: string;
  cantidad: number;
  precio_unit: number;
  total_item?: number; // Calculado automáticamente por MySQL
}

export interface Factura {
  id?: number;
  fecha: string;
  cliente_id: number;
  cliente_nombre?: string; // JOIN con clientes
  factura_nro?: string;
  guia_nro?: string;
  descripcion?: string;
  igv_pct: number;
  detraccion_pct: number;
  estado: 'EMITIDA' | 'PAGADA' | 'PARCIAL';
  packing_id?: number; // ⚠️ NUEVO en tu BD
  total_calculado?: number;
  items?: FacturaItem[];
}

export interface FacturaResponse {
  success: boolean;
  data?: Factura | Factura[];
  message?: string;
  mensaje?: string;
  id?: number;
}