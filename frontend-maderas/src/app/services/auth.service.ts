import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';

// ==========================================
// INTERFACES (Tipado estricto)
// ==========================================
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  // Ajustamos los roles para que coincidan con tu Base de Datos y Dashboard
  rol: 'GERENTE' | 'EMPLEADO' | 'ADMIN'; 
  estado?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 1. Inyecciones (Estilo moderno Angular 16+)
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // 2. Variables de API (Directo para evitar errores de environment)
  private apiUrl = 'http://localhost:3000/api/auth';

  // 3. Estado Reactivo del Usuario
  // Inicializamos leyendo del localStorage para no perder sesión al recargar página
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.getUsuarioFromStorage());
  public usuario$ = this.usuarioSubject.asObservable();

  constructor() {
    // Verificación de integridad al iniciar el servicio
    if (this.getToken()) {
      const usuario = this.getUsuarioFromStorage();
      if (usuario) {
        this.usuarioSubject.next(usuario);
      }
    }
  }

  // ==========================================
  // GETTER CRÍTICO (Soluciona tu error TS2339)
  // ==========================================
  public get currentUserValue(): Usuario | null {
    return this.usuarioSubject.value;
  }

  // ==========================================
  // FUNCIONES PRINCIPALES (Login / Logout)
  // ==========================================

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(res => {
          if (res.success && res.token) {
            // Guardamos en LocalStorage con prefijo 'maderas' para evitar conflictos
            localStorage.setItem('token_maderas', res.token);
            localStorage.setItem('user_maderas', JSON.stringify(res.usuario));
            
            // Actualizamos el estado de la app
            this.usuarioSubject.next(res.usuario);
          }
        })
      );
  }

  logout(): void {
    // Limpiamos LocalStorage
    localStorage.removeItem('token_maderas');
    localStorage.removeItem('user_maderas');
    
    // Limpiamos el estado en memoria
    this.usuarioSubject.next(null);
    
    // Redirigimos al Login
    this.router.navigate(['/login']);
  }

  // ==========================================
  // GETTERS PÚBLICOS (Para Guards e Interceptors)
  // ==========================================

  getToken(): string | null {
    return localStorage.getItem('token_maderas');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token; 
  }

  getUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  // ==========================================
  // ROLES Y PERMISOS
  // ==========================================

  isGerente(): boolean {
    // Verificamos si el rol es exactamente 'GERENTE'
    return this.getUsuario()?.rol === 'GERENTE';
  }

  isEmpleado(): boolean {
    return this.getUsuario()?.rol === 'EMPLEADO';
  }

  getRol(): string | null {
    return this.getUsuario()?.rol || null;
  }

  // ==========================================
  // UTILIDADES PRIVADAS
  // ==========================================

  private getUsuarioFromStorage(): Usuario | null {
    const usuarioStr = localStorage.getItem('user_maderas');
    try {
      return usuarioStr ? JSON.parse(usuarioStr) : null;
    } catch (e) {
      console.error('Error al leer usuario del storage', e);
      return null;
    }
  }
}