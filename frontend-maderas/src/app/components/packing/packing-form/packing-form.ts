import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PackingService } from '../../../services/packing.service';
import { ClienteService } from '../../../services/cliente.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-packing-form', // <--- VS Code busca esto para el import
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './packing-form.html'
})
export class PackingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private packingService = inject(PackingService);
  private clienteService = inject(ClienteService);

  form: FormGroup;
  clientes: any[] = [];
  totalVolumen = 0;

  constructor() {
    this.form = this.fb.group({
      cliente_id: ['', Validators.required],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      observacion: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.cargarClientes();
    this.agregarFila(); // Iniciar con una fila
  }

  cargarClientes() {
    this.clienteService.getClientes().subscribe(data => this.clientes = data);
  }

  get items() {
    return this.form.get('items') as FormArray;
  }

  agregarFila() {
    const item = this.fb.group({
      especie: ['Cachimbo', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      espesor: [1, Validators.required],
      ancho: [1, Validators.required],
      largo: [1, Validators.required],
      vol_pt: [0]
    });

    // Recalcular cuando cambie cualquier valor de la fila
    item.valueChanges.subscribe(() => this.calcularTotal());
    
    this.items.push(item);
    this.calcularTotal();
  }

  eliminarFila(index: number) {
    this.items.removeAt(index);
    this.calcularTotal();
  }

  // Lógica de cálculo de madera
  calcularTotal() {
    let suma = 0;
    this.items.controls.forEach((control) => {
      const val = control.value;
      // Fórmula: (Cant * Esp * Ancho * Largo) / 12
      const pt = (val.cantidad * val.espesor * val.ancho * val.largo) / 12;
      
      // Actualizamos el valor calculado en el formulario (sin emitir evento para evitar loop)
      control.get('vol_pt')?.setValue(parseFloat(pt.toFixed(2)), { emitEvent: false });
      
      suma += pt;
    });
    this.totalVolumen = parseFloat(suma.toFixed(2));
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.packingService.createPacking(this.form.value).subscribe({
      next: (res) => {
        Swal.fire('Guardado', 'Packing registrado con éxito', 'success');
        this.router.navigate(['/packing']);
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo guardar el packing', 'error');
      }
    });
  }
}