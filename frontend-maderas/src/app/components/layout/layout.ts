import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html'
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);

  // Variables para la vista
  nombreUsuario: string = 'Usuario';
  isGerente: boolean = false;

  ngOnInit() {
    // 1. Obtener datos del usuario al cargar
    const usuario = this.authService.getUsuario();
    
    if (usuario) {
      this.nombreUsuario = usuario.nombre;
    }

    // 2. Verificar rol para mostrar/ocultar menús
    this.isGerente = this.authService.isGerente();
  }

  logout() {
    this.authService.logout();
  }
}