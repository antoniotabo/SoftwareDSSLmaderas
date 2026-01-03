import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PackingService } from '../../../services/packing.service';
import Swal from 'sweetalert2';

// 1. IMPORTAMOS LAS LIBRERÍAS DE PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // --- LÓGICA DE GENERACIÓN DE PDF ---
  imprimirPDF(packing: any) {
    // 1. Pedimos los detalles (tablas) de este packing específico
    this.packingService.getPackingItems(packing.id).subscribe({
      next: (res: any) => {
        const items = res.data || [];

        // 2. Creamos el documento
        const doc = new jsPDF();

        // --- ENCABEZADO ---
        doc.setFontSize(20);
        doc.text('DSSL MADERAS', 14, 20); // Nombre de tu empresa
        
        doc.setFontSize(10);
        doc.text('RUC: 20123456789', 14, 26);
        doc.text('Dirección: Pucallpa, Perú', 14, 30);
        
        // Datos del Packing (Lado Derecho)
        doc.setFontSize(16);
        doc.text('PACKING LIST', 140, 20);
        doc.setFontSize(10);
        doc.text(`N°: 000-${packing.id}`, 140, 26);
        doc.text(`Fecha: ${new Date(packing.fecha).toLocaleDateString()}`, 140, 30);

        // --- CAJA DE INFORMACIÓN DEL CLIENTE ---
        doc.setDrawColor(0);
        doc.setFillColor(245, 245, 245); // Gris muy claro
        doc.rect(14, 35, 182, 20, 'F'); // Fondo de la caja
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('DATOS DE LA ORDEN', 16, 42);
        
        doc.setFontSize(10);
        // Usamos la misma lógica que en tu HTML para el nombre
        const cliente = packing.cliente_nombre || `Cliente ID: ${packing.cliente_id}`;
        doc.text(`Cliente: ${cliente}`, 16, 49);
        doc.text(`Especie: ${packing.especie || '-'}`, 100, 49);
        doc.text(`Tipo: ${packing.tipo_madera || '-'}`, 100, 53);

        // --- TABLA DE ITEMS ---
        // Preparamos los datos para jspdf-autotable
        const cuerpoTabla = items.map((item: any) => [
          item.cantidad_piezas,
          item.e,
          item.a,
          item.l,
          item.volumen_pt,
          item.categoria || ''
        ]);

        autoTable(doc, {
          startY: 60,
          head: [['Pzas', 'Espesor', 'Ancho', 'Largo', 'Total PT', 'Detalle']],
          body: cuerpoTabla,
          theme: 'grid',
          headStyles: { fillColor: [52, 58, 64] }, // Color oscuro (bg-dark)
          foot: [['', '', '', 'TOTAL:', this.calcularTotalPT(items), 'PT']],
        });

        // --- FIRMAS (Pie de página) ---
        const finalY = (doc as any).lastAutoTable.finalY + 30;
        
        doc.line(14, finalY, 80, finalY); // Línea firma 1
        doc.text('Entregué Conforme', 14, finalY + 5);
        
        doc.line(110, finalY, 180, finalY); // Línea firma 2
        doc.text('Recibí Conforme', 110, finalY + 5);

        // 3. Descargar
        doc.save(`Packing_List_${packing.id}.pdf`);
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudieron cargar los detalles para imprimir.', 'error');
      }
    });
  }

  // Función auxiliar para sumar totales en el PDF
  calcularTotalPT(items: any[]): string {
    const total = items.reduce((sum, item) => sum + parseFloat(item.volumen_pt || 0), 0);
    return total.toFixed(2);
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