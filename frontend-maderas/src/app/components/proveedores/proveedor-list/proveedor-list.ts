import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './proveedor-list.html'
})
export class ProveedorListComponent implements OnInit {
  private proveedorService = inject(ProveedorService);
  proveedores: any[] = [];

  ngOnInit() {
    this.cargarData();
  }

  cargarData() {
    this.proveedorService.getProveedores().subscribe({
      next: (data: any) => this.proveedores = data,
      error: (e: any) => console.error(e)
    });
  }

  eliminar(id: number) {
    if(confirm('¿Seguro de eliminar este proveedor?')) {
      this.proveedorService.deleteProveedor(id).subscribe(() => this.cargarData());
    }
  }
}