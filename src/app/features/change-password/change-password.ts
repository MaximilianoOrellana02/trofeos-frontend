import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal(false);

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  /** Las nuevas no coinciden. Se evalúa contra los valores en vivo del form. */
  readonly noCoinciden = computed(() => {
    const { newPassword, confirmPassword } = this.form.getRawValue();
    return confirmPassword.length > 0 && newPassword !== confirmPassword;
  });

  showError(campo: 'currentPassword' | 'newPassword'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  volver(): void {
    this.router.navigate(['/ajustes']);
  }

  async guardar(): Promise<void> {
    this.error.set(null);

    if (this.form.invalid || this.noCoinciden()) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();

    try {
      await this.auth.changePassword(currentPassword, newPassword);
      this.exito.set(true);
      this.form.reset();
    } catch (error) {
      this.error.set(this.leerError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  private leerError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'La contraseña actual no es correcta.';
      if (typeof error.error?.error === 'string') return error.error.error;
    }
    return 'No se pudo cambiar la contraseña. Probá de nuevo.';
  }
}
