import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario.html'
})
export class InventarioComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  
  stock: any[] = [];
  movimientos: any[] = [];
  loading = true;

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    
    // 1. Cargar Stock (Tabla real de la BD)
    this.inventarioService.getStock().subscribe({
        next: (res: any) => {
          this.stock = (res.data || res); // Manejo flexible de respuesta
        },
        error: (err) => console.error('Error cargando stock:', err)
    });

    // 2. Cargar Historial
    this.inventarioService.getMovimientos().subscribe({
        next: (res: any) => {
          this.movimientos = (res.data || res);
          this.loading = false;
        },
        error: (err) => console.error('Error cargando movimientos:', err)
    });
  }

  // Función auxiliar para determinar estado del stock
  getStockStatus(cantidad: number): string {
    if (cantidad <= 0) return 'AGOTADO';
    if (cantidad < 1000) return 'BAJO'; // Ajusta este número a tu realidad
    return 'NORMAL';
  }
}