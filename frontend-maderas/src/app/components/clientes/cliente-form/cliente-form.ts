import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
      ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      contacto: [''],
      telefono: [''],
      direccion: ['']
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.id = +idParam;
      this.esEditar = true;
      this.cargarDatosCliente(this.id);
    }

    // 👈 SIEMPRE validar RUC
    this.validarRucDuplicado();
  }

  validarRucDuplicado() {
    this.form.get('ruc')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(ruc => {
          if (!ruc || ruc.length !== 11) {
            return of(null); // ✅ Observable válido
          }
          return this.clienteService.verificarRuc(ruc);
        })
      )
      .subscribe((resp: any) => {
        const control = this.form.get('ruc');

        if (!control || !resp) return;

        if (resp.existe && (!this.esEditar || resp.id !== this.id)) {
          control.setErrors({ ...control.errors, rucExiste: true });
        } else {
          if (control.hasError('rucExiste')) {
            const errors = { ...control.errors };
            delete errors['rucExiste'];
            control.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      });
  }

  cargarDatosCliente(id: number) {
    this.clienteService.getCliente(id).subscribe({
      next: (resp: any) => {
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
      this.clienteService.updateCliente(this.id, cliente).subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: () => alert('Error al actualizar')
      });
    } else {
      this.clienteService.createCliente(cliente).subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: (err) => {
          if (err.status === 409) {
            this.form.get('ruc')?.setErrors({ rucExiste: true });
          } else {
            alert('Error al crear');
          }
        }
      });
    }
  }
}
