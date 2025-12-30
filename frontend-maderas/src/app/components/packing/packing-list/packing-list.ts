import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PackingService } from '../../../services/packing.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-packing-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './packing-list.html'
})
export class PackingListComponent implements OnInit {
  private packingService = inject(PackingService);
  packings: any[] = [];

  ngOnInit() {
    this.cargarPackings();
  }

  cargarPackings() {
    this.packingService.getPackings().subscribe({
      next: (res: any) => {
        if(res.success) this.packings = res.data;
      },
      error: (err) => console.error(err)
    });
  }

  eliminar(id: number) {
    Swal.fire({
      title: '¿Eliminar Packing?',
      text: "Se borrarán todos los items asociados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.packingService.deletePacking(id).subscribe(() => {
          Swal.fire('Eliminado', 'Registro borrado.', 'success');
          this.cargarPackings();
        });
      }
    });
  }
}