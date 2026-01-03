import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TransportistaService } from '../../../services/transportista.service';

@Component({
  selector: 'app-transportista-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transportista-list.html'
})
export class TransportistaListComponent implements OnInit {
  private transportistaService = inject(TransportistaService);
  private router = inject(Router);

  transportistas: any[] = [];

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.transportistaService.getTransportistas().subscribe({
      next: (res: any) => {
        this.transportistas = (res.data && Array.isArray(res.data)) ? res.data : [];
      },
      error: (e) => console.error(e)
    });
  }

  editar(id: number) {
    this.router.navigate(['/transportistas/editar', id]);
  }

  eliminar(id: number) {
    if(confirm('¿Eliminar transportista?')) {
      this.transportistaService.deleteTransportista(id).subscribe(() => this.cargarDatos());
    }
  }
}