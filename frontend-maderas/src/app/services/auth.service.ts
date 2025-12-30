import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { AuthResponse, Usuario } from '../models/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.cargarUsuario();
  }

  login(credenciales: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.currentUserSubject.next(res.usuario);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get estaAutenticado(): boolean {
    return !!this.token;
  }

  private cargarUsuario() {
    const user = localStorage.getItem('usuario');
    if (user) this.currentUserSubject.next(JSON.parse(user));
  }
}