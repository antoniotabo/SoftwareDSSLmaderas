import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CompraService } from '../../../services/compra.service';
import { ProveedorService } from '../../../services/proveedor.service';

@Component({
  selector: 'app-compra-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './compra-form.html'
})
export class CompraFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private compraService = inject(CompraService);
  private proveedorService = inject(ProveedorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  listaProveedores: any[] = []; 
  calculoTotal = 0;
  calculoPendiente = 0;
  isEditMode = false;
  compraId: number | null = null;

  constructor() {
    this.form = this.fb.group({
      proveedor_id: ['', Validators.required],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      tipo_producto: ['', Validators.required],
      cantidad_pt: [0, [Validators.required, Validators.min(0.01)]],
      precio_pt: [0, [Validators.required, Validators.min(0.01)]],
      anticipo: [0],
      estado: ['PENDIENTE']
    });

    this.form.valueChanges.subscribe(val => this.actualizarCalculos(val));
  }

  ngOnInit() {
    // 1. CARGAR PROVEEDORES PRIMERO
    this.proveedorService.getProveedores().subscribe({
      next: (data: any) => {
        this.listaProveedores = Array.isArray(data) ? data : (data.data || []);
        
        // 2. SOLO DESPUÉS DE CARGAR PROVEEDORES, VERIFICAMOS SI HAY EDICIÓN
        this.checkEditMode();
      },
      error: (e) => console.error('Error proveedores:', e)
    });
  }

  checkEditMode() {
    this.route.params.subscribe(params => {
        if (params['id']) {
            this.isEditMode = true;
            this.compraId = +params['id'];
            this.cargarDatosEdicion(this.compraId);
        }
    });
  }

  cargarDatosEdicion(id: number) {
      this.compraService.getCompraById(id).subscribe((res: any) => {
          const compra = res.data || res;
          if (compra) {
              // Formatear fecha para input date
              const fechaStr = compra.fecha ? new Date(compra.fecha).toISOString().split('T')[0] : '';
              
              this.form.patchValue({
                  proveedor_id: compra.proveedor_id, // Ahora sí coincide con la lista cargada
                  fecha: fechaStr,
                  tipo_producto: compra.tipo_producto,
                  cantidad_pt: compra.cantidad_pt,
                  precio_pt: compra.precio_pt,
                  anticipo: compra.anticipo || 0,
                  estado: compra.estado
              });
              this.actualizarCalculos(this.form.value);
          }
      });
  }

  actualizarCalculos(val: any) {
    const cant = Number(val.cantidad_pt) || 0;
    const precio = Number(val.precio_pt) || 0;
    const ant = Number(val.anticipo) || 0;

    this.calculoTotal = cant * precio;
    this.calculoPendiente = Math.max(0, this.calculoTotal - ant);
  }

  guardar() {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEditMode && this.compraId) {
        this.compraService.updateCompra(this.compraId, data).subscribe({
            next: () => {
                alert('Compra actualizada correctamente');
                this.router.navigate(['/compras']);
            },
            error: () => alert('Error al actualizar')
        });
    } else {
        this.compraService.createCompra(data).subscribe({
            next: () => {
                alert('Compra registrada correctamente');
                this.router.navigate(['/compras']);
            },
            error: () => alert('Error al guardar')
        });
    }
  }
}