import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/clientes'; // Ajusta si tu puerto es diferente

  // Listar todos
  getClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Obtener uno solo (para editar)
  getCliente(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo
  createCliente(cliente: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cliente);
  }

  // Actualizar existente
  updateCliente(id: number, cliente: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, cliente);
  }

  // Eliminar
  deleteCliente(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`);
}
}