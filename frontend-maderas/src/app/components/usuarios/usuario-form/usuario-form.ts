import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-form.html'
})
export class UsuarioFormComponent implements OnInit {
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Variables del componente
  form!: FormGroup;
  isEditMode = false;
  usuarioId: number | null = null;
  loading = false;

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  // 1. Inicializar el formulario con validaciones
  private initForm() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]], // Validación base
      rol: ['usuario', Validators.required],
      estado: ['ACTIVO', Validators.required]
    });
  }

  // 2. Verificar si estamos editando o creando
  private checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      // MODO EDICIÓN
      this.isEditMode = true;
      this.usuarioId = +id;
      this.cargarUsuario(this.usuarioId);
    } else {
      // MODO CREACIÓN: La contraseña es obligatoria
      this.form.get('password')?.addValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  // 3. Cargar datos del usuario para editar
  private cargarUsuario(id: number) {
    this.loading = true;
    this.usuarioService.getUsuarioById(id).subscribe({
      next: (res: any) => {
        // Asumimos que la respuesta trae el objeto usuario directamente o dentro de data
        const usuario = res.data || res; // Ajusta según tu backend
        
        this.form.patchValue({
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          estado: usuario.estado
          // No cargamos el password por seguridad
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuario:', err);
        alert('Error al cargar los datos del usuario');
        this.router.navigate(['/usuarios']);
        this.loading = false;
      }
    });
  }

  // 4. Guardar (Crear o Actualizar)
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Marca los campos en rojo si hay error
      return;
    }

    const formData = this.form.value;

    this.loading = true;

    if (this.isEditMode && this.usuarioId) {
      // --- ACTUALIZAR ---
      
      // Si la contraseña está vacía, la quitamos del objeto para no sobreescribirla
      if (!formData.password) {
        delete formData.password;
      }

      this.usuarioService.updateUsuario(this.usuarioId, formData).subscribe({
        next: () => {
          alert('Usuario actualizado correctamente');
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          console.error(err);
          alert('Error al actualizar usuario. Verifique si el correo ya existe.');
          this.loading = false;
        }
      });

    } else {
      // --- CREAR ---
      this.usuarioService.createUsuario(formData).subscribe({
        next: () => {
          alert('Usuario creado exitosamente');
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          console.error(err);
          alert('Error al crear usuario. Verifique si el correo ya existe.');
          this.loading = false;
        }
      });
    }
  }
}