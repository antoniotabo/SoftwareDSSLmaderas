import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/inventario'; // Ajusta tu puerto

  getStock(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stock`);
  }

  getMovimientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/movimientos`);
  }
}