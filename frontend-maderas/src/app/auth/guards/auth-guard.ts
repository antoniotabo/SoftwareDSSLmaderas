import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // CORRECCIÓN AQUÍ:
  // 1. Cambiamos 'estaAutenticado' por 'isAuthenticated'
  // 2. Agregamos paréntesis ()
  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};