import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router'; 
import { FacturaService } from '../../../services/factura.service';
// ✅ 1. IMPORTAMOS EL SERVICIO DE CLIENTES
import { ClienteService } from '../../../services/cliente.service';

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
  private clienteService = inject(ClienteService); // Inyección
  
  facturas: any[] = [];
  clientes: any[] = []; // Aquí guardaremos la lista completa de clientes con sus datos

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Cargar Facturas
    this.facturaService.getFacturas().subscribe({
      next: (data) => this.facturas = data,
      error: (e) => console.error('Error facturas:', e)
    });

    // 2. Cargar Clientes (Para tener RUC, Teléfono y Email a mano)
    this.clienteService.getClientes().subscribe({
      next: (res: any) => {
        // Aseguramos que sea un array (a veces viene envuelto en .data)
        this.clientes = Array.isArray(res) ? res : res.data || [];
        console.log('Clientes cargados para PDF:', this.clientes);
      },
      error: (e) => console.error('Error clientes:', e)
    });
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      this.facturaService.deleteFactura(id).subscribe({
        next: () => {
          this.cargarDatos(); // Recargamos todo
          alert('Factura eliminada correctamente');
        },
        error: (e) => alert('Error al eliminar la factura')
      });
    }
  }

  // ==========================================
  // 3. GENERAR PDF (CRUZANDO DATOS DE CLIENTE)
  // ==========================================
  descargarPDF(id: number) {
    this.facturaService.getFacturaById(id).subscribe({
      next: (res: any) => {
        const factura = res.data || res;
        
        // 🔥 EL TRUCO MAESTRO: BUSCAR AL CLIENTE POR SU ID
        // Usamos la lista 'this.clientes' que ya cargamos y que tiene TODOS los datos (RUC, Tlf, etc)
        const clienteCompleto = this.clientes.find(c => c.id == factura.cliente_id);

        if (clienteCompleto) {
            // Inyectamos los datos del cliente real a la factura antes de imprimir
            factura.cliente_real = clienteCompleto;
        } else {
            // Fallback por si acaso
            factura.cliente_real = {
                razon_social: factura.cliente_nombre || 'Cliente General',
                ruc: '00000000000',
                contacto: '',
                telefono: ''
            };
        }

        this.generarDocumentoPDF(factura);
      },
      error: (err) => alert('Error al cargar datos para el PDF')
    });
  }

  generarDocumentoPDF(factura: any) {
    const doc = new jsPDF();
    const cliente = factura.cliente_real || {}; // Datos enriquecidos

    // --- CABECERA EMPRESA ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MORRISON GREEN FOREST E.I.R.L.', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 20609978920', 14, 26);
    doc.text('Dirección: Jr. Fitzcarrald Nro. 159', 14, 31);

    // --- CUADRO FACTURA ---
    doc.setDrawColor(0);
    doc.setFillColor(250, 250, 250); 
    doc.rect(130, 15, 65, 25, 'FD'); 
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA ELECTRÓNICA', 162.5, 23, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(200, 0, 0); 
    doc.text(`N° ${factura.factura_nro}`, 162.5, 32, { align: 'center' });
    doc.setTextColor(0); 

    // --- DATOS DEL CLIENTE COMPLETOS ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', 14, 50);
    
    doc.setFont('helvetica', 'normal');
    
    // 1. Razón Social (Nombre)
    const nombre = cliente.razon_social || 'Cliente General';
    doc.text(`Señor(es): ${nombre}`, 14, 56);

    // 2. RUC del Cliente (¡Dato nuevo!)
    const rucCliente = cliente.ruc || cliente.numero_documento || '-';
    doc.text(`RUC/DNI: ${rucCliente}`, 14, 62);

    // 3. Dirección y Teléfono (¡Datos nuevos!)
    // Usamos el campo 'contacto' para email como se ve en tu imagen, y telefono
    const telefono = cliente.telefono || '-';
    const email = cliente.contacto || cliente.email || '-'; 
    
    // Combinamos para ahorrar espacio o lo ponemos en líneas separadas
    doc.text(`Teléfono: ${telefono}  |  Email: ${email}`, 14, 68);

    // 4. Datos de Emisión
    const fechaTexto = factura.fecha ? new Date(factura.fecha).toLocaleDateString() : '--/--/----';
    
    // Movemos esto a la derecha o abajo
    doc.text(`Fecha Emisión: ${fechaTexto}`, 130, 56);
    doc.text(`Guía Remisión: ${factura.guia_nro || '-'}`, 130, 62);


    // --- TABLA DE ITEMS ---
    const columnas = ['Item', 'Descripción', 'Cant.', 'P. Unit', 'Total'];
    const items = factura.items || [];
    
    const filas = items.map((item: any, index: number) => [
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
      headStyles: { fillColor: [41, 128, 185], halign: 'center' },
      columnStyles: {
          0: { halign: 'center', cellWidth: 15 }, 
          2: { halign: 'center', cellWidth: 20 }, 
          3: { halign: 'right', cellWidth: 25 }, 
          4: { halign: 'right', cellWidth: 30 } 
      }
    });

    // --- TOTALES ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const subtotal = items.reduce((acc: number, it: any) => acc + (it.cantidad * it.precio_unit), 0);
    let pctIgv = 0.18; 
    if (factura.igv_pct !== undefined && factura.igv_pct !== null) {
        pctIgv = Number(factura.igv_pct);
    }
    const igv = subtotal * pctIgv;
    const total = subtotal + igv;

    const formatoMoneda = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`SUBTOTAL:`, 140, finalY);
    doc.text(`S/ ${subtotal.toLocaleString('es-PE', formatoMoneda)}`, 190, finalY, { align: 'right' });

    const labelIGV = pctIgv > 0 ? 'IGV (18%):' : 'IGV (0%):';
    doc.text(labelIGV, 140, finalY + 6);
    doc.text(`S/ ${igv.toLocaleString('es-PE', formatoMoneda)}`, 190, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL:`, 140, finalY + 14);
    doc.text(`S/ ${total.toLocaleString('es-PE', formatoMoneda)}`, 190, finalY + 14, { align: 'right' });

    doc.save(`Factura_${factura.factura_nro}.pdf`);
  }
}