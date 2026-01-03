export interface Cobranza {
  id?: number;
  factura_id: number;
  fecha: string;
  anticipo: number;
  entregado: number;
}

export interface CobranzaResponse {
  success: boolean;
  data?: Cobranza | Cobranza[];
  message?: string;
  mensaje?: string;
}