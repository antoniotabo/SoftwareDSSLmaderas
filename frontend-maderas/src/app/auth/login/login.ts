import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;
    
    // 1. Extraemos los valores individuales del formulario
    const formValue = this.loginForm.value;
    const email = formValue.email || '';
    const password = formValue.password || '';

    // 2. Pasamos los argumentos separados por coma (email, password)
    this.auth.login(email, password).subscribe({
      next: () => {
        const Toast = Swal.mixin({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
        });
        Toast.fire({ icon: 'success', title: 'Bienvenido al sistema' });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        Swal.fire('Error', err.error.message || 'Credenciales inválidas', 'error');
      }
    });
  }
}