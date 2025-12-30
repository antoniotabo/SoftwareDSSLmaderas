import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // 👈 Importante

import { routes } from './app.routes';
import { authInterceptor } from './auth/interceptors/auth-interceptor'; // 👈 Asegúrate que la ruta sea correcta

export const appConfig: ApplicationConfig = {
  providers: [
    // Optimización de detección de cambios (recomendado por Angular)
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Proveedor de Rutas
    provideRouter(routes),

    // Proveedor HTTP con el Interceptor (ESTO SOLUCIONA EL ERROR 401)
    provideHttpClient(withInterceptors([authInterceptor])) 
  ]
};