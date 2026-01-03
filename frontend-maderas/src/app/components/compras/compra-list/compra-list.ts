import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; // ✅ Importante para ngModel
import { CompraService } from '../../../services/compra.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Declaramos bootstrap para manejar el modal sin jQuery
declare var bootstrap: any;

@Component({
  selector: 'app-compra-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // ✅ Agregado FormsModule
  templateUrl: './compra-list.html'
})
export class CompraListComponent implements OnInit {
  private compraService = inject(CompraService);
  private router = inject(Router);
  
  compras: any[] = [];
  
  // Variables para el Modal de Pago
  compraSeleccionada: any = null;
  montoPagar: number = 0;
  modalInstance: any;

  ngOnInit() {
    this.cargarCompras();
  }

  cargarCompras() {
    this.compraService.getCompras().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.compras = data;
        } else if (data && Array.isArray(data.data)) {
          this.compras = data.data;
        } else {
          this.compras = [];
        }
      },
      error: (e: any) => { 
        console.error('Error cargando compras:', e);
        this.compras = [];
      }
    });
  }

  editar(id: number) {
    this.router.navigate(['/compras/editar', id]);
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar esta compra permanentemente?')) {
      this.compraService.deleteCompra(id).subscribe({
        next: () => this.cargarCompras(),
        error: () => alert('No se pudo eliminar la compra')
      });
    }
  }

  // ==========================================
  // ✅ LÓGICA DEL MODAL DE PAGO
  // ==========================================
  abrirModalPago(compra: any) {
      this.compraSeleccionada = compra;
      this.montoPagar = 0; // Resetear input
      
      const modalEl = document.getElementById('modalPago');
      if(modalEl) {
          this.modalInstance = new bootstrap.Modal(modalEl);
          this.modalInstance.show();
      }
  }

  pagarTodo() {
      if(this.compraSeleccionada) {
          this.montoPagar = this.compraSeleccionada.total_pendiente;
      }
  }

  guardarPago() {
      if (!this.montoPagar || this.montoPagar <= 0) {
          alert('Ingrese un monto válido mayor a 0');
          return;
      }
      
      if (this.montoPagar > this.compraSeleccionada.total_pendiente + 0.1) {
          alert('El monto excede la deuda pendiente');
          return;
      }

      // Llamada al servicio (Asegúrate de tener este método en tu service)
      this.compraService.registrarPago(this.compraSeleccionada.id, this.montoPagar).subscribe({
          next: () => {
              alert('Pago registrado exitosamente');
              this.modalInstance.hide();
              this.cargarCompras(); // Recargar tabla para ver cambios
          },
          error: () => alert('Error al registrar el pago')
      });
  }

  // ==========================================
  // PDF
  // ==========================================
  descargarPDF(compra: any) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('DSSL MADERAS', 14, 20);
    doc.setFontSize(10);
    doc.text('Comprobante de Compra / Gasto', 14, 26);
    doc.text(`Fecha: ${new Date(compra.fecha).toLocaleDateString()}`, 14, 32);
    doc.text(`Proveedor: ${compra.proveedor_nombre || '---'}`, 14, 42);
    doc.text(`Producto: ${compra.tipo_producto}`, 14, 48);
    
    autoTable(doc, {
      startY: 55,
      head: [['Descripción', 'Cant (PT)', 'Precio Unit.', 'Total']],
      body: [[
          compra.tipo_producto, 
          compra.cantidad_pt, 
          `S/ ${compra.precio_pt}`, 
          `S/ ${compra.total_compra}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [25, 135, 84] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`TOTAL: S/ ${compra.total_compra}`, 140, finalY);
    
    // Agregar estado de deuda en el PDF
    doc.setFontSize(10);
    doc.text(`Pagado: S/ ${compra.anticipo}`, 140, finalY + 7);
    doc.text(`Pendiente: S/ ${compra.total_pendiente}`, 140, finalY + 14);

    doc.save(`Compra_${compra.id}.pdf`);
  }
}