import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private http = inject(HttpClient);
  // Asegúrate de que esta URL coincida con tu backend
  private apiUrl = 'http://localhost:3000/api/facturas'; 

  getFacturas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // ✅ NUEVO: Obtener una sola factura para editar
  getFacturaById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createFactura(factura: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, factura);
  }

  // ✅ NUEVO: Actualizar factura existente
  updateFactura(id: number, factura: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, factura);
  }

  deleteFactura(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}