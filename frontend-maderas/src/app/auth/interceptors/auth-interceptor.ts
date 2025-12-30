import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos el servicio de autenticación
  const authService = inject(AuthService);
  
  // Obtenemos el token actual (si existe)
  const token = authService.token;

  // Si hay token, clonamos la petición y le pegamos la cabecera
  if (token) {
    req = req.clone({
      setHeaders: { 
        Authorization: `Bearer ${token}` 
      }
    });
  }

  // Dejamos pasar la petición (con o sin token)
  return next(req);
};