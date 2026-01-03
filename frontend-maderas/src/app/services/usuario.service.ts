import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'admin' | 'usuario';
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface UsuarioResponse {
  success: boolean;
  message?: string;
  mensaje?: string;
  data?: Usuario | Usuario[];
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  getUsuarios(): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(this.apiUrl);
  }

  getUsuarioById(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  createUsuario(usuario: Usuario): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.apiUrl, usuario);
  }

  updateUsuario(id: number, usuario: Usuario): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}`, usuario);
  }

  cambiarPassword(id: number, password_nuevo: string): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}/password`, { password_nuevo });
  }

  deleteUsuario(id: number): Observable<UsuarioResponse> {
    return this.http.delete<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }
}