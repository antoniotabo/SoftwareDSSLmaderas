import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PackingItem {
  id?: number;
  packing_id?: number;
  cantidad_piezas: number;
  e: number;           // Espesor (pulgadas)
  a: number;           // Ancho (pulgadas)
  l: number;           // Largo (pies)
  volumen_pt: number;  // Volumen en pies tablares
  categoria?: string;
}

export interface Packing {
  id?: number;
  fecha: string;
  cliente_id: number;
  cliente_nombre?: string;
  especie?: string;
  tipo_madera?: string;
  observaciones?: string;
  total_pt?: number;
  items?: PackingItem[];
}

export interface PackingResponse {
  success: boolean;
  message?: string;
  data?: Packing | Packing[];
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PackingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/packing`; // http://localhost:3000/api/packing

  // Listar todos los packings
  getPackings(): Observable<PackingResponse> {
    return this.http.get<PackingResponse>(this.apiUrl);
  }

  // Obtener un packing por ID con sus items
  getPackingById(id: number): Observable<PackingResponse> {
    return this.http.get<PackingResponse>(`${this.apiUrl}/${id}`); // ✅ CORREGIDO: / en lugar de :
  }

  // Obtener solo los items de un packing
  getPackingItems(id: number): Observable<PackingResponse> {
    return this.http.get<PackingResponse>(`${this.apiUrl}/${id}/items`);
  }

  // Crear un nuevo packing con items
  createPacking(packing: Packing): Observable<PackingResponse> {
    console.log('📤 Enviando packing:', packing);
    return this.http.post<PackingResponse>(this.apiUrl, packing);
  }

  // Actualizar un packing
  updatePacking(id: number, packing: Packing): Observable<PackingResponse> {
    return this.http.put<PackingResponse>(`${this.apiUrl}/${id}`, packing);
  }

  // Eliminar un packing
  deletePacking(id: number): Observable<PackingResponse> {
    return this.http.delete<PackingResponse>(`${this.apiUrl}/${id}`);
  }
  
}