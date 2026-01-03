import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // Importante: ReactiveFormsModule
  templateUrl: './cliente-form.html'
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  id: number | null = null;
  esEditar = false;

  constructor() {
    this.form = this.fb.group({
      razon_social: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.minLength(11)]],
      contacto: [''],
      telefono: [''],
      direccion: ['']
    });
  }

  ngOnInit() {
    // Verificar si hay un ID en la URL (Modo Editar)
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.esEditar = true;
      this.cargarDatosCliente(this.id);
    }
  }

  cargarDatosCliente(id: number) {
    this.clienteService.getCliente(id).subscribe({
      next: (resp: any) => {
        // Si el backend devuelve { success: true, data: {...} }
        const data = resp.data || resp; 
        this.form.patchValue(data);
      },
      error: () => this.router.navigate(['/clientes'])
    });
  }

  guardar() {
    if (this.form.invalid) return;

    const cliente = this.form.value;

    if (this.esEditar && this.id) {
      // ACTUALIZAR
      this.clienteService.updateCliente(this.id, cliente).subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: (e) => alert('Error al actualizar')
      });
    } else {
      // CREAR
      this.clienteService.createCliente(cliente).subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: (e) => alert('Error al crear')
      });
    }
  }
}