import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

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
  pendiente?: number;
  estado?: 'CANCELADO' | 'PENDIENTE';
  fecha_cancelacion?: string;
  observacion?: string;
}

export interface FleteResponse {
  success: boolean;
  message?: string;
  mensaje?: string;
  data?: Flete | Flete[];
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

@Injectable({
  providedIn: 'root'
})
export class FleteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fletes`;

  getFletes(params?: any): Observable<FleteResponse> {
    return this.http.get<FleteResponse>(this.apiUrl, { params });
  }

  getFleteById(id: number): Observable<FleteResponse> {
    return this.http.get<FleteResponse>(`${this.apiUrl}/${id}`);
  }

  createFlete(flete: Flete): Observable<FleteResponse> {
    return this.http.post<FleteResponse>(this.apiUrl, flete);
  }

  updateFlete(id: number, flete: Flete): Observable<FleteResponse> {
    return this.http.put<FleteResponse>(`${this.apiUrl}/${id}`, flete);
  }

  registrarPago(id: number, monto_pago: number, fecha_pago: string): Observable<FleteResponse> {
    return this.http.post<FleteResponse>(`${this.apiUrl}/${id}/pago`, { 
      monto_pago, 
      fecha_pago 
    });
  }

  deleteFlete(id: number): Observable<FleteResponse> {
    return this.http.delete<FleteResponse>(`${this.apiUrl}/${id}`);
  }

  getEstadisticas(): Observable<{ success: boolean; data: EstadisticasFletes }> {
    return this.http.get<{ success: boolean; data: EstadisticasFletes }>(`${this.apiUrl}/estadisticas`);
  }
}