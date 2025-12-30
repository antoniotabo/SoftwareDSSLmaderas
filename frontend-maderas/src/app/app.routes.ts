import { Routes } from '@angular/router';
// 1. Importamos Layout desde 'layout' (sin .component, sin .ts)
import { LayoutComponent } from './components/layout/layout'; 
// 2. Importamos Login desde 'login' (sin .component, sin .ts)
import { LoginComponent } from './auth/login/login';
import { authGuard } from './auth/guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    
    // Ruta Login
    { path: 'login', component: LoginComponent },

    // Rutas Protegidas (Layout)
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            { 
                path: 'dashboard', 
                // CORRECCIÓN: Apunta al archivo 'dashboard' (corto), busca la clase 'DashboardComponent'
                loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent) 
            },
            { 
                path: 'packing', 
                // CORRECCIÓN: Apunta al archivo 'packing-list' (corto)
                loadComponent: () => import('./components/packing/packing-list/packing-list').then(m => m.PackingListComponent) 
            },
            { 
                path: 'packing/nuevo', 
                // CORRECCIÓN: Apunta al archivo 'packing-form' (corto)
                loadComponent: () => import('./components/packing/packing-form/packing-form').then(m => m.PackingFormComponent) 
            },
            { 
                path: 'clientes', 
                // CORRECCIÓN: Apunta al archivo 'cliente-list' (corto)
                loadComponent: () => import('./components/clientes/cliente-list/cliente-list').then(m => m.ClienteListComponent) 
            }
        ]
    },
    
    { path: '**', redirectTo: '/dashboard' }
];