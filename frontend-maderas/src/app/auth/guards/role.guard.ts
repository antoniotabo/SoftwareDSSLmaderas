import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
// Asegúrate de que la ruta al servicio sea la correcta
import { AuthService } from '../../services/auth.service'; 

export const adminOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenemos el usuario actual
  const usuario = authService.currentUserValue;

  // 1. Si no hay usuario logueado, fuera
  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  // 2. CORRECCIÓN AQUÍ: Comparamos con 'GERENTE' (Mayúsculas)
  // Si tu base de datos también usa 'ADMIN', lo agregamos por si acaso.
  if (usuario.rol === 'GERENTE' || usuario.rol === 'ADMIN') {
    return true; // Puede pasar
  }

  // 3. Si es EMPLEADO, lo bloqueamos
  alert('⛔ Acceso Restringido: Esta sección es exclusiva para Gerencia.');
  router.navigate(['/dashboard']); // Lo devolvemos al inicio seguro
  return false;
};