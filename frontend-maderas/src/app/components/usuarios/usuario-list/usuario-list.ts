import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsuarioService, Usuario } from '../../../services/usuario.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './usuario-list.html'
})
export class UsuarioListComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);

  usuarios: Usuario[] = [];
  loading = false;
  usuarioActualId: number;

  constructor() {
    this.usuarioActualId = this.authService.getUsuario()?.id || 0;
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (res) => {
        if (res.success && res.data && Array.isArray(res.data)) {
          this.usuarios = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.loading = false;
      }
    });
  }

  getBadgeClass(estado: string): string {
    return estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary';
  }

  getRolBadge(rol: string): string {
    return rol === 'admin' ? 'bg-danger' : 'bg-primary';
  }

  getRolTexto(rol: string): string {
    return rol === 'admin' ? 'Gerente' : 'Empleado';
  }

  cambiarPassword(id: number, nombre: string) {
    const nueva = prompt(`Cambiar contraseña de: ${nombre}\n\nIngrese nueva contraseña (mín. 6 caracteres):`);
    
    if (!nueva || nueva.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.usuarioService.cambiarPassword(id, nueva).subscribe({
      next: () => {
        alert('Contraseña cambiada correctamente');
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error al cambiar contraseña');
      }
    });
  }

  eliminar(id: number, nombre: string) {
    if (id === this.usuarioActualId) {
      alert('No puedes eliminar tu propia cuenta');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar al usuario "${nombre}"?`)) return;

    this.usuarioService.deleteUsuario(id).subscribe({
      next: () => {
        alert('Usuario eliminado correctamente');
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error al eliminar usuario');
      }
    });
  }
}