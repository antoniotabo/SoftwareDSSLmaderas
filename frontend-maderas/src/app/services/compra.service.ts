import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/compras'; // Asegúrate que este sea tu puerto correcto

  // 1. Listar todas
  getCompras(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // ✅ 2. AGREGADO: Obtener una por ID (Soluciona el error TS2551)
  getCompraById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // 3. Crear
  createCompra(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // 4. Actualizar
  updateCompra(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // 5. Eliminar
  deleteCompra(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ✅ 6. AGREGADO: Registrar Pago / Amortizar (Soluciona el error TS2339)
  registrarPago(id: number, monto: number): Observable<any> {
    // Enviamos 'monto_pago' porque así lo espera tu controlador del backend
    return this.http.put(`${this.apiUrl}/${id}/pago`, { monto_pago: monto });
  }
}