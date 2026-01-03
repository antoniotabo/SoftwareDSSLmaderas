export interface Stock {
  id?: number;
  especie?: string;
  tipo_madera?: string;
  cantidad_pt: number;
  ubicacion?: string;
}

export interface StockReal {
  producto: string;
  entradas_pt: number;
  salidas_pt: number;
  stock_actual_pt: number;
}

export interface StockResponse {
  success: boolean;
  data?: Stock | Stock[] | StockReal[];
  message?: string;
}