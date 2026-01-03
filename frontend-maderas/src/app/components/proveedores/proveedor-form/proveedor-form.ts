import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './proveedor-form.html'
})
export class ProveedorFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  isEdit = false;
  idEdit: number | null = null;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      ruc: ['', [Validators.pattern(/^[0-9]{11}$/)]], // Validación opcional de 11 dígitos
      contacto: [''],
      estado: ['ACTIVO', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.idEdit = +params['id'];
        this.cargarDatosEdicion(); 
      }
    });
  }
  
  // ✅ ESTA ES LA FUNCIÓN QUE TE FALTABA
  cargarDatosEdicion() {
    // Reutilizamos getProveedores y buscamos en la lista
    this.proveedorService.getProveedores().subscribe({
      next: (res: any) => {
        // Aseguramos que sea un array
        const lista = Array.isArray(res) ? res : (res.data || []);
        
        // Buscamos el proveedor específico por su ID
        const proveedor = lista.find((p: any) => p.id === this.idEdit);

        if (proveedor) {
          // Llenamos el formulario con los datos encontrados
          this.form.patchValue({
            nombre: proveedor.nombre,
            ruc: proveedor.ruc,
            contacto: proveedor.contacto,
            estado: proveedor.estado
          });
        }
      },
      error: (e: any) => console.error('Error al cargar proveedor', e)
    });
  }

  guardar() {
    if (this.form.invalid) return;

    if (this.isEdit && this.idEdit) {
      // Editar
      this.proveedorService.updateProveedor(this.idEdit, this.form.value).subscribe({
        next: () => {
          alert('Proveedor actualizado correctamente');
          this.router.navigate(['/proveedores']);
        },
        error: () => alert('Error al actualizar')
      });
    } else {
      // Crear
      this.proveedorService.createProveedor(this.form.value).subscribe({
        next: () => {
          alert('Proveedor creado correctamente');
          this.router.navigate(['/proveedores']);
        },
        error: () => alert('Error al crear')
      });
    }
  }
}