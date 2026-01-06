import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FacturaService } from '../../../services/factura.service';
import { ClienteService } from '../../../services/cliente.service';
import { PackingService } from '../../../services/packing.service';

@Component({
  selector: 'app-facturacion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './factura-form.html'
})
export class FacturacionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private facturaService = inject(FacturaService);
  private clienteService = inject(ClienteService);
  private packingService = inject(PackingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  clientes: any[] = [];
  packings: any[] = [];
  
  // ✅ VARIABLES EXACTAS PARA EL HTML (Sin cálculos extra en la vista)
  subtotalCalculado = 0; // Valor Venta (Base)
  igvCalculado = 0;      // Impuesto
  totalCalculado = 0;    // Total a Pagar

  isEditMode = false;
  facturaId: number | null = null;
  loadingPackings = false;

  constructor() {
    this.form = this.fb.group({
      cliente_id: ['', Validators.required],
      packing_id: [''],
      factura_nro: ['', Validators.required],
      guia_nro: [''],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      descripcion: [''],
      incluir_igv: [true], // Switch
      items: this.fb.array([]) 
    });
  }

  ngOnInit() {
    this.clienteService.getClientes().subscribe(data => this.clientes = Array.isArray(data) ? data : (data as any).data);
    this.packingService.getPackings().subscribe({ next: (res: any) => this.packings = res.data || res });

    // Recalcular siempre que algo cambie
    this.form.valueChanges.subscribe(() => this.calcularTotales());

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.facturaId = +params['id'];
        this.cargarFactura(this.facturaId);
      } else {
        this.agregarItem(); 
      }
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  // ==========================================================
  // ✅ 1. CORRECCIÓN NOMBRE "MADERA CUMALA" Y DECIMALES
  // ==========================================================
  onPackingChange(event: any) {
    const packingId = event.target.value;
    if (!packingId) return;

    if (this.items.length > 0 && this.items.at(0).get('producto')?.value !== '') {
        if(!confirm('Se reemplazarán los items actuales. ¿Continuar?')) {
            this.form.patchValue({ packing_id: '' });
            return;
        }
    }

    this.loadingPackings = true;
    
    this.packingService.getPackingById(packingId).subscribe({
        next: (res: any) => {
            const packing = res.data || res;
            
            // Auto-cliente
            if (packing.cliente_id) this.form.patchValue({ cliente_id: packing.cliente_id });

            // Especie Principal del Packing (ej: CUMALA)
            const especiePrincipal = packing.especie || 'Madera';

            this.items.clear();
            const itemsPacking = packing.items || [];

            if (itemsPacking.length > 0) {
                itemsPacking.forEach((pItem: any) => {
                    // Si el item no tiene categoría específica, usamos la del Packing (CUMALA)
                    let nombreMadera = pItem.categoria;
                    if (!nombreMadera || nombreMadera === 'Madera' || nombreMadera === 'Estándar') {
                        nombreMadera = especiePrincipal;
                    }

                    // ✅ DECIMALES: .toFixed(2) para que salga 2.00" x 4.00"
                    const e = Number(pItem.e).toFixed(2);
                    const a = Number(pItem.a).toFixed(2);
                    const l = Number(pItem.l).toFixed(2);

                    const descripcion = `Madera ${nombreMadera} - ${e}" x ${a}" x ${l}'`;
                    
                    this.agregarItem({
                        producto: descripcion,
                        cantidad: pItem.volumen_pt, 
                        precio_unit: 0 
                    });
                });
            } else {
                this.agregarItem();
            }
            this.loadingPackings = false;
        },
        error: (err) => { console.error(err); this.loadingPackings = false; }
    });
  }

  agregarItem(itemData: any = null) {
    const itemGroup = this.fb.group({
      producto: [itemData ? itemData.producto : '', Validators.required],
      cantidad: [itemData ? itemData.cantidad : 1, [Validators.required, Validators.min(0.01)]],
      precio_unit: [itemData ? itemData.precio_unit : 0, [Validators.required, Validators.min(0)]],
      total_item: [0]
    });
    // Calcular inicial
    const total = (itemGroup.get('cantidad')?.value || 0) * (itemGroup.get('precio_unit')?.value || 0);
    itemGroup.get('total_item')?.setValue(total);
    
    this.items.push(itemGroup);
  }

  eliminarItem(index: number) {
    this.items.removeAt(index);
  }

  // ==========================================================
  // ✅ 2. CORRECCIÓN CÁLCULO (1000 + 180 = 1180)
  // ==========================================================
  calcularTotales() {
    const items = this.items.controls;
    let subtotalTemp = 0;

    items.forEach((control) => {
        const cant = Number(control.get('cantidad')?.value) || 0;
        const precio = Number(control.get('precio_unit')?.value) || 0;
        const totalLinea = cant * precio;
        
        if (control.get('total_item')?.value !== totalLinea) {
            control.get('total_item')?.setValue(totalLinea, { emitEvent: false });
        }
        subtotalTemp += totalLinea;
    });

    // 1. SUBTOTAL (BASE IMPONIBLE)
    this.subtotalCalculado = subtotalTemp;

    // 2. IGV (18% SOBRE LA BASE)
    const aplicaIGV = this.form.get('incluir_igv')?.value;
    if (aplicaIGV) {
        this.igvCalculado = this.subtotalCalculado * 0.18;
    } else {
        this.igvCalculado = 0;
    }

    // 3. TOTAL (SUMA SIMPLE)
    this.totalCalculado = this.subtotalCalculado + this.igvCalculado;
  }

  cargarFactura(id: number) {
    this.facturaService.getFacturaById(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (data.fecha) data.fecha = data.fecha.split('T')[0];
        const tieneIGV = (data.igv_pct && data.igv_pct > 0);

        this.form.patchValue({
          cliente_id: data.cliente_id,
          packing_id: data.packing_id,
          factura_nro: data.factura_nro,
          guia_nro: data.guia_nro,
          fecha: data.fecha,
          descripcion: data.descripcion,
          incluir_igv: tieneIGV
        });

        this.items.clear();
        if (data.items) {
            data.items.forEach((item: any) => this.agregarItem(item));
        }
        setTimeout(() => this.calcularTotales(), 50);
      }
    });
  }

  guardar() {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
    }
    const dataToSend = {
        ...this.form.value,
        igv_pct: this.form.value.incluir_igv ? 0.18 : 0,
        subtotal: this.subtotalCalculado,
        total: this.totalCalculado
    };

    if (this.isEditMode && this.facturaId) {
      this.facturaService.updateFactura(this.facturaId, dataToSend).subscribe({
        next: () => { alert('Actualizado'); this.router.navigate(['/facturacion']); }
      });
    } else {
      this.facturaService.createFactura(dataToSend).subscribe({
        next: () => { alert('Creado'); this.router.navigate(['/facturacion']); }
      });
    }
  }
}