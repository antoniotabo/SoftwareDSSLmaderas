import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FleteService, Flete } from '../../../services/flete.service';
import { TransportistaService } from '../../../services/transportista.service';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

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

  filtros = {
    estado: '',
    transportista_id: '',
    desde: '',
    hasta: ''
  };

  stats = {
    total_fletes: 0,
    pendientes: 0,
    cancelados: 0,
    total_valor: 0,
    total_pendiente: 0
  };

  // Variables para el Modal
  fleteSeleccionado: Flete | null = null;
  montoPagar: number = 0;
  private modalRef: any = null; // ✅ Guardamos la referencia del modal aquí

  ngOnInit() {
    this.cargarTransportistas();
    this.cargarFletes();
    this.cargarEstadisticas();
  }

  // ... (Tus funciones cargarTransportistas, cargarEstadisticas, limpiarFiltros, getBadgeClass, eliminar... DÉJALAS IGUAL) ...
  cargarTransportistas() {
    this.transportistaService.getTransportistas().subscribe({
      next: (data) => {
        if (Array.isArray(data)) this.transportistas = data;
        else if (data.data) this.transportistas = data.data;
      }
    });
  }

  cargarFletes() {
    this.loading = true;
    
    // ... tu lógica de filtros ...
    const params: any = { ...this.filtros }; 
    Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

    this.fleteService.getFletes(params).subscribe({
      next: (res) => {
        // ✅ CORRECCIÓN AQUÍ:
        // Agregamos "Array.isArray(res.data)" para asegurarle a TypeScript que es una lista
        if (res.success && res.data && Array.isArray(res.data)) {
           this.fletes = res.data;
        } else {
           this.fletes = []; // Si no es un array o es null, ponemos array vacío
        }
        
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.fletes = []; // En caso de error, limpiamos la tabla
      }
    });
  }
  cargarEstadisticas() {
      this.fleteService.getEstadisticas().subscribe(res => {
          if(res.success) this.stats = res.data;
      });
  }

  limpiarFiltros() {
      this.filtros = { estado: '', transportista_id: '', desde: '', hasta: '' };
      this.cargarFletes();
  }

  getBadgeClass(estado: string) {
      return estado === 'CANCELADO' ? 'bg-success' : 'bg-warning text-dark';
  }

  calcularPagado(f: any): number {
    return (parseFloat(f.adelanto) || 0) + (parseFloat(f.pago) || 0);
  }

  eliminar(id: number) {
      if(!confirm('¿Eliminar flete?')) return;
      this.fleteService.deleteFlete(id).subscribe(() => {
          this.cargarFletes();
          this.cargarEstadisticas();
      });
  }

  // ==========================================================
  // ✅ CORRECCIÓN: LÓGICA DEL MODAL DE PAGO (Singleton)
  // ==========================================================

  abrirModalPago(flete: Flete) {
    this.fleteSeleccionado = flete;
    
    // Calculamos el pendiente actual
    const pendiente = parseFloat((flete.pendiente || 0).toString());
    
    // Sugerimos el total pendiente, pero el usuario puede editarlo para pagos parciales
    this.montoPagar = pendiente;

    // Inicializamos el modal SOLO UNA VEZ
    if (!this.modalRef) {
      const el = document.getElementById('modalPagoFlete');
      if (el) {
        this.modalRef = new bootstrap.Modal(el);
      }
    }

    // Mostramos el modal
    if (this.modalRef) {
      this.modalRef.show();
    }
  }

  pagarTodo() {
    if (this.fleteSeleccionado) {
      this.montoPagar = parseFloat((this.fleteSeleccionado.pendiente || 0).toString());
    }
  }

  guardarPago() {
    if (this.montoPagar <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    if (!this.fleteSeleccionado) return;

    const pendienteActual = parseFloat((this.fleteSeleccionado.pendiente || 0).toString());

    // Validamos que no pague más de lo que debe (con margen de 0.50 por decimales)
    if (this.montoPagar > pendienteActual + 0.5) {
      alert(`El monto excede la deuda (Max: S/ ${pendienteActual.toFixed(2)})`);
      return;
    }

    const fechaActual = new Date().toISOString().split('T')[0];

    this.fleteService.registrarPago(this.fleteSeleccionado.id!, this.montoPagar, fechaActual).subscribe({
      next: (res) => {
        alert('Pago registrado exitosamente');

        // 1. Ocultar modal primero
        if (this.modalRef) {
          this.modalRef.hide();
        }

        // 2. Recargar datos (Esto traerá el nuevo pendiente para el próximo pago)
        this.cargarFletes();
        this.cargarEstadisticas();
        
        // No ponemos fleteSeleccionado en null inmediatamente para evitar parpadeos visuales
      },
      error: (err) => {
        console.error(err);
        alert('Error al registrar el pago');
      }
    });
  }
}