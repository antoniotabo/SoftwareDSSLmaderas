import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FacturaService } from '../../../services/factura.service';
import { ClienteService } from '../../../services/cliente.service';
// ✅ Importamos el servicio de Packing
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
  private packingService = inject(PackingService); // ✅ Inyección
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  clientes: any[] = [];
  packings: any[] = []; // ✅ Lista de packings disponibles
  totalGeneral = 0;
  isEditMode = false;
  facturaId: number | null = null;
  loadingPackings = false;

  constructor() {
    this.form = this.fb.group({
      cliente_id: ['', Validators.required],
      packing_id: [''], // ✅ Control para el packing
      factura_nro: ['', Validators.required],
      guia_nro: [''],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      descripcion: [''],
      igv_pct: [0.18],
      detraccion_pct: [0.04],
      items: this.fb.array([]) 
    });
  }

  ngOnInit() {
    // 1. Cargar Clientes
    this.clienteService.getClientes().subscribe(data => {
        this.clientes = Array.isArray(data) ? data : (data as any).data;
    });

    // 2. Cargar Packings (Solo los recientes para no saturar)
    this.packingService.getPackings().subscribe({
        next: (res: any) => {
            this.packings = res.data || res;
        }
    });

    // 3. Verificar Edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.facturaId = +params['id'];
        this.cargarFactura(this.facturaId);
      } else {
        this.agregarItem(); // Fila vacía por defecto
      }
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  // ✅ LOGICA DE NEGOCIO: Al seleccionar un Packing
  onPackingChange(event: any) {
    const packingId = event.target.value;
    if (!packingId) return;

    // Preguntar antes de borrar lo que ya escribió
    if (this.items.length > 0 && this.items.at(0).get('producto')?.value !== '') {
        if(!confirm('Al seleccionar un packing se reemplazarán los items actuales. ¿Desea continuar?')) {
            this.form.patchValue({ packing_id: '' }); // Cancelar selección
            return;
        }
    }

    this.loadingPackings = true;
    
    // Obtenemos el detalle del packing desde el backend
    this.packingService.getPackingById(packingId).subscribe({
        next: (res: any) => {
            const packing = res.data || res; // Ajusta según tu backend
            
            // 1. Auto-seleccionar Cliente si coincide
            if (packing.cliente_id) {
                this.form.patchValue({ cliente_id: packing.cliente_id });
            }

            // 2. Llenar Items
            this.items.clear();
            const itemsPacking = packing.items || []; // Asumimos que el endpoint trae items

            if (itemsPacking.length > 0) {
                itemsPacking.forEach((pItem: any) => {
                    // Formatear descripción técnica: Especie + Medidas
                    const descripcion = `${pItem.categoria || 'Madera'} - ${pItem.e}" x ${pItem.a}" x ${pItem.l}'`;
                    
                    this.agregarItem({
                        producto: descripcion,
                        cantidad: pItem.volumen_pt, // Importante: Facturamos PT
                        precio_unit: 0 // El precio lo pone el usuario
                    });
                });
            } else {
                alert('El packing seleccionado no tiene items registrados.');
                this.agregarItem();
            }
            this.loadingPackings = false;
        },
        error: (err) => {
            console.error(err);
            this.loadingPackings = false;
        }
    });
  }

  agregarItem(itemData: any = null) {
    const itemGroup = this.fb.group({
      producto: [itemData ? itemData.producto : '', Validators.required],
      cantidad: [itemData ? itemData.cantidad : 1, [Validators.required, Validators.min(0.01)]],
      precio_unit: [itemData ? itemData.precio_unit : 0, [Validators.required, Validators.min(0)]],
      total_item: [itemData ? (itemData.cantidad * itemData.precio_unit) : 0]
    });

    // Suscribirse a cambios para recalcular en tiempo real
    itemGroup.get('cantidad')?.valueChanges.subscribe(() => this.calcularFila(itemGroup));
    itemGroup.get('precio_unit')?.valueChanges.subscribe(() => this.calcularFila(itemGroup));

    this.items.push(itemGroup);
    this.calcularTotal();
  }

  calcularFila(group: FormGroup) {
      const cant = group.get('cantidad')?.value || 0;
      const precio = group.get('precio_unit')?.value || 0;
      const total = cant * precio;
      group.get('total_item')?.setValue(total, { emitEvent: false });
      this.calcularTotal();
  }

  eliminarItem(index: number) {
    this.items.removeAt(index);
    this.calcularTotal();
  }

  calcularTotal() {
    this.totalGeneral = 0;
    this.items.controls.forEach(control => {
      this.totalGeneral += (control.get('total_item')?.value || 0);
    });
  }

  cargarFactura(id: number) {
    this.facturaService.getFacturaById(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (data.fecha) data.fecha = data.fecha.split('T')[0];

        this.form.patchValue({
          cliente_id: data.cliente_id,
          packing_id: data.packing_id, // Cargar packing vinculado
          factura_nro: data.factura_nro,
          guia_nro: data.guia_nro,
          fecha: data.fecha,
          descripcion: data.descripcion,
          igv_pct: data.igv_pct,
          detraccion_pct: data.detraccion_pct
        });

        this.items.clear();
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: any) => this.agregarItem(item));
        }
        this.calcularTotal();
      },
      error: (err) => alert('Error al cargar la factura')
    });
  }

  guardar() {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
    }
    const data = this.form.value;

    if (this.isEditMode && this.facturaId) {
      this.facturaService.updateFactura(this.facturaId, data).subscribe({
        next: () => {
            alert('Factura actualizada');
            this.router.navigate(['/facturacion']);
        },
        error: () => alert('Error al actualizar')
      });
    } else {
      this.facturaService.createFactura(data).subscribe({
        next: () => {
            alert('Factura creada exitosamente');
            this.router.navigate(['/facturacion']);
        },
        error: () => alert('Error al crear')
      });
    }
  }
}