import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout';
import { LoginComponent } from './auth/login/login';
import { authGuard } from './auth/guards/auth-guard';
import { adminOnlyGuard } from './auth/guards/role.guard';

export const routes: Routes = [
    // 1. Redirección inicial
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    
    // 2. Login (Público)
    { 
        path: 'login', 
        component: LoginComponent 
    },

    // 3. Rutas Protegidas (Layout principal)
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            // --- DASHBOARD ---
            { 
                path: 'dashboard', 
                loadComponent: () => import('./components/dashboard/dashboard')
                    .then(m => m.DashboardComponent) 
            },

            // --- COMPRAS ---
            { 
                path: 'compras', 
                loadComponent: () => import('./components/compras/compra-list/compra-list')
                    .then(m => m.CompraListComponent) 
            },
            { 
                path: 'compras/nueva', 
                loadComponent: () => import('./components/compras/compra-form/compra-form')
                    .then(m => m.CompraFormComponent) 
            },
            { 
                path: 'compras/editar/:id', 
                loadComponent: () => import('./components/compras/compra-form/compra-form')
                    .then(m => m.CompraFormComponent) 
            },

            // --- PROVEEDORES ---
            { 
                path: 'proveedores', 
                loadComponent: () => import('./components/proveedores/proveedor-list/proveedor-list')
                    .then(m => m.ProveedorListComponent) 
            },
            { 
                path: 'proveedores/nuevo', 
                loadComponent: () => import('./components/proveedores/proveedor-form/proveedor-form')
                    .then(m => m.ProveedorFormComponent) 
            },
            { 
                path: 'proveedores/editar/:id', 
                loadComponent: () => import('./components/proveedores/proveedor-form/proveedor-form')
                    .then(m => m.ProveedorFormComponent) 
            },

            // --- PACKING ---
            { 
                path: 'packing', 
                loadComponent: () => import('./components/packing/packing-list/packing-list')
                    .then(m => m.PackingListComponent) 
            },
            { 
                path: 'packing/nuevo', 
                loadComponent: () => import('./components/packing/packing-form/packing-form')
                    .then(m => m.PackingFormComponent) 
            },
            { 
                path: 'packing/editar/:id', 
                loadComponent: () => import('./components/packing/packing-form/packing-form')
                    .then(m => m.PackingFormComponent) 
            },

            // --- CLIENTES ---
            { 
                path: 'clientes', 
                loadComponent: () => import('./components/clientes/cliente-list/cliente-list')
                    .then(m => m.ClienteListComponent) 
            },
            { 
                path: 'clientes/nuevo', 
                loadComponent: () => import('./components/clientes/cliente-form/cliente-form')
                    .then(m => m.ClienteFormComponent) 
            },
            { 
                path: 'clientes/editar/:id', 
                loadComponent: () => import('./components/clientes/cliente-form/cliente-form')
                    .then(m => m.ClienteFormComponent) 
            },

            // --- FACTURACIÓN ---
            { 
                path: 'facturacion',
                loadComponent: () => import('./components/facturas/factura-list/factura-list')
                    .then(m => m.FacturaListComponent)
            },
            { 
                path: 'facturacion/nueva',
                loadComponent: () => import('./components/facturas/factura-form/factura-form')
                    .then(m => m.FacturacionFormComponent)
            },
            { 
                path: 'facturacion/editar/:id',
                loadComponent: () => import('./components/facturas/factura-form/factura-form')
                    .then(m => m.FacturacionFormComponent)
            },

            // --- ✅ TRANSPORTISTAS (NUEVO) ---
            {
                path: 'transportistas',
                loadComponent: () => import('./components/transportistas/transportista-list/transportista-list')
                    .then(m => m.TransportistaListComponent)
            },
            {
                path: 'transportistas/nuevo',
                loadComponent: () => import('./components/transportistas/transportista-form/transportista-form')
                    .then(m => m.TransportistaFormComponent)
            },
            {
                path: 'transportistas/editar/:id',
                loadComponent: () => import('./components/transportistas/transportista-form/transportista-form')
                    .then(m => m.TransportistaFormComponent)
            },

            // --- FLETES ---
            {
                path: 'fletes',
                loadComponent: () => import('./components/flete/flete-list/flete-list')
                    .then(m => m.FleteListComponent)
            },
            {
                path: 'fletes/nuevo',
                loadComponent: () => import('./components/flete/flete-form/flete-form')
                    .then(m => m.FleteFormComponent)
            },
            {
                path: 'fletes/editar/:id',
                loadComponent: () => import('./components/flete/flete-form/flete-form')
                    .then(m => m.FleteFormComponent)
            },

            // --- INVENTARIO / KARDEX ---
            { 
                path: 'inventario', 
                loadComponent: () => import('./components/inventario/inventario')
                    .then(m => m.InventarioComponent)
            },

            // --- USUARIOS (SOLO GERENTE) 🔒 ---
            {
                path: 'usuarios',
                canActivate: [adminOnlyGuard],
                loadComponent: () => import('./components/usuarios/usuario-list/usuario-list')
                    .then(m => m.UsuarioListComponent)
            },
            {
                path: 'usuarios/nuevo',
                canActivate: [adminOnlyGuard],
                loadComponent: () => import('./components/usuarios/usuario-form/usuario-form')
                    .then(m => m.UsuarioFormComponent)
            },
            {
                path: 'usuarios/editar/:id',
                canActivate: [adminOnlyGuard],
                loadComponent: () => import('./components/usuarios/usuario-form/usuario-form')
                    .then(m => m.UsuarioFormComponent)
            }
        ]
    },
    
    // 4. Ruta comodín
    { path: '**', redirectTo: '/dashboard' }
];