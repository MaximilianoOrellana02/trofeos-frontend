import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly mode = signal<Mode>('login');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  })

  readonly submitLabel = computed(() =>
    this.mode() === 'login' ? 'Entrar a mis trofeos' : 'Crear mi cuenta'
  )

  setMode(mode: Mode): void {
    if (this.mode() === mode) return;

    this.mode.set(mode);
    this.errorMessage.set(null);;
    this.form.reset();
  }

  async submit(): Promise<void> {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const credentials = this.form.getRawValue();

    try {
      if (this.mode() === 'login') {
        await this.authService.login(credentials);
      } else {
        await this.authService.register(credentials);
      }

      // Si todavía no vinculó PSN, el flujo continúa en la pantalla de vinculación.
      const destino = this.authService.psnLinked() ? '/inicio' : '/vincular';
      this.router.navigate([destino]);
    } catch (error) {
      this.errorMessage.set(this.readError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private readError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Revisá tu conexion';
      }

      if (typeof error.error?.error === 'string') {
        return error.error.error;
      }
    }
    return 'Algo falló. Probá de nuevo en un momento.'
  }


  showError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty)
  }
}