export interface Flete {
  id?: number;
  fecha: string;
  transportista_id: number;
  transportista_nombre?: string;
  guia_remitente?: string;
  guia_transportista?: string;
  detalle_carga?: string;
  valor_flete: number;
  adelanto?: number;
  pago?: number;
  pendiente?: number; // Calculado por MySQL
  estado?: 'CANCELADO' | 'PENDIENTE'; // Calculado por MySQL
  fecha_cancelacion?: string;
  observacion?: string;
}

export interface FleteResponse {
  success: boolean;
  data?: Flete | Flete[];
  message?: string;
  mensaje?: string;
  id?: number;
  nuevo_pendiente?: number;
}

export interface EstadisticasFletes {
  total_fletes: number;
  pendientes: number;
  cancelados: number;
  total_valor: number;
  total_pendiente: number;
}