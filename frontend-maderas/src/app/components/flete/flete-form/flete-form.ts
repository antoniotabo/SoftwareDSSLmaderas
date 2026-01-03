import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FleteService } from '../../../services/flete.service';
import { TransportistaService } from '../../../services/transportista.service';

@Component({
  selector: 'app-flete-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './flete-form.html'
})
export class FleteFormComponent implements OnInit {
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private fleteService = inject(FleteService);
  private transportistaService = inject(TransportistaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Variables
  form: FormGroup;
  transportistas: any[] = [];
  isEditMode = false;
  fleteId: number | null = null;

  constructor() {
    this.form = this.fb.group({
      fecha: [new Date().toISOString().substring(0, 10), Validators.required],
      transportista_id: ['', Validators.required],
      guia_remitente: [''],
      guia_transportista: [''],
      detalle_carga: [''],
      valor_flete: [0, [Validators.required, Validators.min(0)]],
      adelanto: [0, [Validators.min(0)]],
      pago: [0, [Validators.min(0)]],
      observacion: ['']
    });
  }

  ngOnInit() {
    this.cargarTransportistas();

    // Verificar si es modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.fleteId = +params['id'];
        this.cargarFlete();
      }
    });
  }

  cargarTransportistas() {
    this.transportistaService.getTransportistas().subscribe({
      next: (res: any) => {
        // Manejamos si viene como array directo o dentro de .data
        const lista = (Array.isArray(res)) ? res : (res.data || []);
        
        // Filtramos solo los activos
        this.transportistas = lista.filter((t: any) => t.estado === 'ACTIVO');
      },
      error: (err) => console.error('Error al cargar transportistas:', err)
    });
  }

  cargarFlete() {
    if (!this.fleteId) return;

    this.fleteService.getFleteById(this.fleteId).subscribe({
      next: (res: any) => { // 1. IMPORTANTE: Ponemos 'any' aquí
        
        // 2. IMPORTANTE: Definimos 'data' como 'any' para evitar líneas rojas
        const data: any = (res.success && res.data) ? res.data : res;

        if (data) {
          // --- CORRECCIÓN DE FECHA ---
          // Si la fecha viene con hora (ej: ...T05:00:00), la cortamos
          let fechaFormat = data.fecha;
          if (fechaFormat && typeof fechaFormat === 'string' && fechaFormat.includes('T')) {
             fechaFormat = fechaFormat.split('T')[0];
          }

          // Cargamos los datos al formulario
          this.form.patchValue({
            fecha: fechaFormat,
            transportista_id: data.transportista_id,
            guia_remitente: data.guia_remitente,
            guia_transportista: data.guia_transportista,
            detalle_carga: data.detalle_carga,
            valor_flete: data.valor_flete,
            adelanto: data.adelanto,
            pago: data.pago,
            observacion: data.observacion
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar flete:', err);
        alert('Error al cargar los datos del flete');
        this.router.navigate(['/fletes']);
      }
    });
  }

  // Getter auxiliar para calcular saldo en vivo
  get pendienteCalculado(): number {
    const valor = this.form.get('valor_flete')?.value || 0;
    const adelanto = this.form.get('adelanto')?.value || 0;
    const pago = this.form.get('pago')?.value || 0;
    return Math.max(0, valor - adelanto - pago);
  }

  guardar() {
    if (this.form.invalid) {
      alert('Por favor complete todos los campos obligatorios');
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    console.log('📤 Datos a enviar:', this.form.value);

    if (this.isEditMode && this.fleteId) {
      // --- ACTUALIZAR ---
      this.fleteService.updateFlete(this.fleteId, this.form.value).subscribe({
        next: () => {
          alert('Flete actualizado correctamente');
          this.router.navigate(['/fletes']);
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          alert('Error al actualizar: ' + (err.error?.mensaje || err.message));
        }
      });
    } else {
      // --- CREAR ---
      this.fleteService.createFlete(this.form.value).subscribe({
        next: () => {
          alert('Flete registrado correctamente');
          this.router.navigate(['/fletes']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          alert('Error al guardar: ' + (err.error?.mensaje || err.message));
        }
      });
    }
  }
}