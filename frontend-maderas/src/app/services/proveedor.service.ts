import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  // Ajusta la URL si decidiste usar /api/proveedores en lugar de anidarlo en compras
  private apiUrl = 'http://localhost:3000/api/proveedores'; 

  getProveedores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createProveedor(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateProveedor(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteProveedor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}