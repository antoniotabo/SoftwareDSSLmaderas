import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FleteService, Flete } from '../../../services/flete.service';
import { TransportistaService } from '../../../services/transportista.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-flete-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './flete-list.html'
})
export class FleteListComponent implements OnInit {
  private fleteService = inject(FleteService);
  private transportistaService = inject(TransportistaService);

  fletes: Flete[] = [];
  transportistas: any[] = [];
  loading = false;

  // Filtros
  filtros = {
    estado: '',
    transportista_id: '',
    desde: '',
    hasta: ''
  };

  // Estadísticas
  stats = {
    total_fletes: 0,
    pendientes: 0,
    cancelados: 0,
    total_valor: 0,
    total_pendiente: 0
  };

  ngOnInit() {
    this.cargarTransportistas();
    this.cargarFletes();
    this.cargarEstadisticas();
  }

  cargarTransportistas() {
    this.transportistaService.getTransportistas().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.transportistas = data;
        } else if (data.data && Array.isArray(data.data)) {
          this.transportistas = data.data;
        }
      },
      error: (err) => console.error('Error al cargar transportistas:', err)
    });
  }

  cargarFletes() {
    this.loading = true;
    const params: any = {};

    if (this.filtros.estado) params.estado = this.filtros.estado;
    if (this.filtros.transportista_id) params.transportista_id = this.filtros.transportista_id;
    if (this.filtros.desde) params.desde = this.filtros.desde;
    if (this.filtros.hasta) params.hasta = this.filtros.hasta;

    this.fleteService.getFletes(params).subscribe({
      next: (res) => {
        if (res.success && res.data && Array.isArray(res.data)) {
          this.fletes = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar fletes:', err);
        this.loading = false;
      }
    });
  }

  cargarEstadisticas() {
    this.fleteService.getEstadisticas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats = res.data;
        }
      },
      error: (err) => console.error('Error al cargar estadísticas:', err)
    });
  }

  limpiarFiltros() {
    this.filtros = {
      estado: '',
      transportista_id: '',
      desde: '',
      hasta: ''
    };
    this.cargarFletes();
  }

  getBadgeClass(estado: string): string {
    return estado === 'CANCELADO' ? 'bg-success' : 'bg-warning text-dark';
  }

  eliminar(id: number) {
    if (!confirm('¿Está seguro de eliminar este flete?')) return;

    this.fleteService.deleteFlete(id).subscribe({
      next: () => {
        alert('Flete eliminado correctamente');
        this.cargarFletes();
        this.cargarEstadisticas();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        alert('Error al eliminar el flete');
      }
    });
  }

  // ✅ AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL
  mostrarModalPago(flete: Flete) {
    // 1. SOLUCIÓN AL ERROR: pendiente?.toFixed is not a function
    // Convertimos a número lo que venga de la BD (aunque sea texto)
    const pendienteReal = parseFloat((flete.pendiente || 0).toString());

    const monto = prompt(`Registrar pago para flete #${flete.id}\nPendiente: S/ ${pendienteReal.toFixed(2)}\n\nIngrese monto:`);
    
    if (!monto || isNaN(parseFloat(monto))) return;

    // 2. SOLUCIÓN AL ERROR DE FECHA
    // Generamos la fecha actual en formato YYYY-MM-DD simple
    const fechaActual = new Date().toISOString().split('T')[0];

    this.fleteService.registrarPago(flete.id!, parseFloat(monto), fechaActual).subscribe({
      next: (res) => {
        // Validación extra por si la respuesta viene numérica o texto
        const nuevoPendiente = res.nuevo_pendiente ? parseFloat(res.nuevo_pendiente.toString()) : 0;
        alert(`Pago registrado. Nuevo pendiente: S/ ${nuevoPendiente.toFixed(2)}`);
        
        this.cargarFletes();
        this.cargarEstadisticas();
      },
      error: (err) => {
        console.error('Error al registrar pago:', err);
        alert('Error al registrar el pago');
      }
    });
  }
}