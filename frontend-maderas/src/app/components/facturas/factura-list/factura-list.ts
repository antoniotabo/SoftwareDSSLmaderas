import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router'; 
import { FacturaService } from '../../../services/factura.service';

// ✅ 1. IMPORTAR LIBRERÍAS DE PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-factura-list',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './factura-list.html'
})
export class FacturaListComponent implements OnInit {
  private facturaService = inject(FacturaService);
  facturas: any[] = [];

  ngOnInit() {
    this.cargarFacturas();
  }

  cargarFacturas() {
    this.facturaService.getFacturas().subscribe({
      next: (data) => {
        this.facturas = data;
        console.log('Facturas cargadas:', this.facturas);
      },
      error: (e) => console.error('Error al cargar:', e)
    });
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      this.facturaService.deleteFactura(id).subscribe({
        next: () => {
          this.cargarFacturas(); 
          alert('Factura eliminada correctamente');
        },
        error: (e) => {
          console.error(e);
          alert('Error al eliminar la factura');
        }
      });
    }
  }

  // ==========================================
  // ✅ 2. NUEVA LÓGICA: GENERAR PDF
  // ==========================================
  descargarPDF(id: number) {
    // Primero pedimos los datos completos (con items) al backend
    this.facturaService.getFacturaById(id).subscribe({
      next: (res: any) => {
        const factura = res.data || res; // Ajuste por si viene envuelto
        this.generarDocumentoPDF(factura);
      },
      error: (err) => alert('Error al cargar datos para el PDF')
    });
  }

  generarDocumentoPDF(factura: any) {
    const doc = new jsPDF();

    // --- CABECERA DE LA EMPRESA ---
    doc.setFontSize(18);
    doc.text('EMPRESA MADERERA DEMO S.A.C.', 14, 20);
    doc.setFontSize(10);
    doc.text('RUC: 20123456789', 14, 26);
    doc.text('Dirección: Av. Forestal 123, Pucallpa', 14, 31);

    // --- CUADRO FACTURA ---
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(130, 15, 65, 25, 'FD'); 
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA ELECTRÓNICA', 162, 23, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); 
    doc.text(`N° ${factura.factura_nro}`, 162, 32, { align: 'center' });
    doc.setTextColor(0); 

    // --- DATOS CLIENTE ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', 14, 50);
    doc.setFont('helvetica', 'normal');
    
    const clienteNombre = factura.cliente_nombre || 'Cliente General'; 
    doc.text(`Señor(es): ${clienteNombre}`, 14, 56);
    doc.text(`Fecha Emisión: ${new Date(factura.fecha).toLocaleDateString()}`, 14, 62);
    doc.text(`Guía Remisión: ${factura.guia_nro || '-'}`, 14, 68);

    // --- TABLA DE ITEMS ---
    const columnas = ['Item', 'Descripción', 'Cant.', 'P. Unit', 'Total'];
    const filas = (factura.items || []).map((item: any, index: number) => [
      index + 1,
      item.producto,
      item.cantidad,
      `S/ ${Number(item.precio_unit).toFixed(2)}`,
      `S/ ${Number(item.cantidad * item.precio_unit).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [columnas],
      body: filas,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // --- TOTALES ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Cálculos seguros
    const items = factura.items || [];
    const total = items.reduce((acc: number, it: any) => acc + (it.cantidad * it.precio_unit), 0);
    const subtotal = total / (1 + (factura.igv_pct || 0.18));
    const igv = total - subtotal;
    const detraccion = total * (factura.detraccion_pct || 0.04);

    doc.setFontSize(10);
    doc.text(`SUBTOTAL:`, 140, finalY);
    doc.text(`S/ ${subtotal.toFixed(2)}`, 190, finalY, { align: 'right' });

    doc.text(`IGV:`, 140, finalY + 6);
    doc.text(`S/ ${igv.toFixed(2)}`, 190, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL:`, 140, finalY + 14);
    doc.text(`S/ ${total.toFixed(2)}`, 190, finalY + 14, { align: 'right' });

    // Detracción nota
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Sujeto a detracción: S/ ${detraccion.toFixed(2)}`, 14, finalY + 20);

    // Guardar
    doc.save(`Factura_${factura.factura_nro}.pdf`);
  }
}