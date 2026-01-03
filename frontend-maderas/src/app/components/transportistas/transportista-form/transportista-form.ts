import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TransportistaService } from '../../../services/transportista.service';

@Component({
  selector: 'app-transportista-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './transportista-form.html'
})
export class TransportistaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transportistaService = inject(TransportistaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  isEditMode = false;
  id: number | null = null;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      contacto: [''],
      estado: ['ACTIVO'] // Valor por defecto
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.id = +params['id'];
        this.cargarDatos(this.id);
      }
    });
  }

  cargarDatos(id: number) {
    this.transportistaService.getTransportistas().subscribe((res: any) => {
      const lista = res.data || [];
      const item = lista.find((t: any) => t.id === id);
      if (item) {
        this.form.patchValue(item);
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;

    if (this.isEditMode && this.id) {
      this.transportistaService.updateTransportista(this.id, this.form.value).subscribe(() => {
        alert('Datos actualizados');
        this.router.navigate(['/transportistas']);
      });
    } else {
      this.transportistaService.createTransportista(this.form.value).subscribe(() => {
        alert('Transportista registrado');
        this.router.navigate(['/transportistas']);
      });
    }
  }
}