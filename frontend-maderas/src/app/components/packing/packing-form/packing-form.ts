import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { PackingService } from '../../../services/packing.service';
import { ClienteService } from '../../../services/cliente.service';
import { InventarioService } from '../../../services/inventario.service';

@Component({
  selector: 'app-packing-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './packing-form.html'
})
export class PackingFormComponent implements OnInit {
  // Injections
  private fb = inject(FormBuilder);
  private packingService = inject(PackingService);
  private clienteService = inject(ClienteService);
  private inventarioService = inject(InventarioService);  
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form & State Variables
  form: FormGroup;
  clientes: any[] = [];
  listaEspecies: string[] = [];
  listaTipos: string[] = [];
  totalPT = 0;
  isEditMode = false;
  packingId: number | null = null;

  constructor() {
    this.form = this.fb.group({
      cliente_id: ['', Validators.required],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      especie: [''],           
      tipo_madera: [''],       
      observaciones: [''],     
      items: this.fb.array([]) 
    });
  }

  ngOnInit() {
    this.cargarClientes();
    this.cargarListasInventario();
    // Check for ID in URL (Edit Mode)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.packingId = +params['id'];
        this.cargarDatosPacking(this.packingId);
      } else {
        // Only add empty row if we are creating new
        this.agregarItem(); 
      }
    });
  }

  // --- LOADING DATA ---

  cargarClientes() {
    this.clienteService.getClientes().subscribe(data => {
      this.clientes = Array.isArray(data) ? data : (data as any).data;
    });
  }
cargarListasInventario() {
    this.inventarioService.getSelectores().subscribe({
      next: (res: any) => {
        // Asumiendo que tu backend devuelve { especies: [...], tipos: [...] }
        this.listaEspecies = res.especies || [];
        this.listaTipos = res.tipos || [];
      },
      error: (err) => console.error('Error cargando listas de inventario:', err)
    });
  }
  cargarDatosPacking(id: number) {
    // 1. Get Header Data (Client, Date, Species)
    this.packingService.getPackingById(id).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        
        // Fix Date format
        if (data.fecha && typeof data.fecha === 'string' && data.fecha.includes('T')) {
          data.fecha = data.fecha.split('T')[0];
        }

        this.form.patchValue({
          cliente_id: data.cliente_id,
          fecha: data.fecha,
          especie: data.especie,
          tipo_madera: data.tipo_madera,
          observaciones: data.observaciones
        });
      },
      error: (err) => console.error('Error loading header:', err)
    });

    // 2. Get Items Data (The wood boards)
    this.packingService.getPackingItems(id).subscribe({
      next: (res: any) => {
        const items = res.data || [];
        
        // Clear default empty row
        this.items.clear();

        // Create a form row for each item from DB
        items.forEach((item: any) => {
          this.agregarItem(item);
        });

        this.calcularTotalPT();
      },
      error: (err) => console.error('Error loading items:', err)
    });
  }

  // --- FORM ARRAY MANAGEMENT ---

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  // Modified to accept optional data (for loading existing items)
  agregarItem(data: any = null) {
    const itemGroup = this.fb.group({
      cantidad_piezas: [data ? data.cantidad_piezas : 0, [Validators.required, Validators.min(1)]],
      e: [data ? data.e : 0, [Validators.required, Validators.min(0.001)]], // Thickness
      a: [data ? data.a : 0, [Validators.required, Validators.min(0.001)]], // Width
      l: [data ? data.l : 0, [Validators.required, Validators.min(0.001)]], // Length
      volumen_pt: [data ? data.volumen_pt : 0],
      categoria: [data ? data.categoria : '']
    });

    // Auto-calculate volume on changes
    itemGroup.valueChanges.subscribe(() => {
      this.calcularVolumenItem(itemGroup);
      this.calcularTotalPT();
    });

    this.items.push(itemGroup);
  }

  eliminarItem(index: number) {
    this.items.removeAt(index);
    this.calcularTotalPT();
  }

  // --- CALCULATIONS ---

  calcularVolumenItem(itemGroup: FormGroup) {
    const cant = itemGroup.get('cantidad_piezas')?.value || 0;
    const e = itemGroup.get('e')?.value || 0;
    const a = itemGroup.get('a')?.value || 0;
    const l = itemGroup.get('l')?.value || 0;

    // Formula: (E * A * L * Cant) / 12
    const volumen = (e * a * l * cant) / 12;
    
    // Set value without triggering another event loop
    itemGroup.get('volumen_pt')?.setValue(volumen, { emitEvent: false });
  }

  calcularTotalPT() {
    this.totalPT = 0;
    this.items.controls.forEach(control => {
      const vol = control.get('volumen_pt')?.value || 0;
      this.totalPT += vol;
    });
  }

  // --- SAVE / UPDATE ---

  guardar() {
    if (this.form.invalid) {
      alert('Por favor complete todos los campos requeridos');
      this.form.markAllAsTouched();
      return;
    }

    const itemsData = this.items.value;
    
    if (!itemsData || itemsData.length === 0) {
      alert('Debe agregar al menos un item');
      return;
    }

    const hasInvalidItems = itemsData.some((item: any) => 
      !item.cantidad_piezas || !item.e || !item.a || !item.l
    );

    if (hasInvalidItems) {
      alert('Todos los items deben tener valores numéricos válidos');
      return;
    }

    // Logic for Update vs Create
    if (this.isEditMode && this.packingId) {
      // UPDATE
      this.packingService.updatePacking(this.packingId, this.form.value).subscribe({
        next: () => {
          alert('Packing actualizado correctamente');
          this.router.navigate(['/packing']);
        },
        error: (err) => {
          console.error('Error updating:', err);
          alert('Error al actualizar el packing');
        }
      });
    } else {
      // CREATE
      this.packingService.createPacking(this.form.value).subscribe({
        next: () => {
          alert('Packing guardado correctamente');
          this.router.navigate(['/packing']);
        },
        error: (err) => {
          console.error('Error creating:', err);
          alert('Error al guardar el packing');
        }
      });
    }
  }
}