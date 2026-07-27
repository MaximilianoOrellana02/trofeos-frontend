import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { SyncService } from '../../../core/services/sync.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

const NPSSO_LENGTH = 64;
const URL_PLAYSTATION = 'https://www.playstation.com/';
const URL_CODIGO = 'https://ca.account.sony.com/api/v1/ssocookie';

@Component({
  selector: 'app-link-psn',
  imports: [],
  templateUrl: './link-psn.html',
  styleUrl: './link-psn.css',
})
export class LinkPsn {
  private authService = inject(AuthService);
  private syncService = inject(SyncService);
  private router = inject(Router)

  readonly TOTAL_PASOS = 3;
  readonly LARGO_ESPERADO = NPSSO_LENGTH;

  readonly paso = signal(1);
  readonly codigo = signal('');
  readonly conectando = signal(false);
  readonly error = signal<string | null>(null);

  readonly cantidadCaracteres = computed(() => this.codigo().length);

  readonly codigoCompleto = computed(
    () => this.cantidadCaracteres() === NPSSO_LENGTH
  )

  readonly codigoExcedido = computed(
    () => this.cantidadCaracteres() > NPSSO_LENGTH
  );

  /** Aviso antes de intentar conectar, para no gastar un viaje al servidor. */
  readonly avisoLargo = computed(() => {
    const largo = this.cantidadCaracteres();
    if (largo === 0) return null;
    if (largo < NPSSO_LENGTH) {
      return `Te faltan ${NPSSO_LENGTH - largo} caracteres.`;
    }
    if (largo > NPSSO_LENGTH) {
      return `Te sobran ${largo - NPSSO_LENGTH} caracteres.`;
    }
    return null;
  });

  // -------------------------------------------------------------------------
  // Navegación del wizard
  // -------------------------------------------------------------------------

  avanzar(): void {
    if (this.paso() < this.TOTAL_PASOS) {
      this.paso.update((p) => p + 1);
      this.error.set(null);
    }
  }

  retroceder(): void {
    if (this.paso() > 1) {
      this.paso.update((p) => p - 1);
      this.error.set(null);
    } else {
      // Desde el primer paso, salir es cerrar sesión
      this.authService.logout();
    }
  }

  irAlPaso(destino: number): void {
    this.paso.set(destino);
    this.error.set(null);
  }

  // -------------------------------------------------------------------------
  // Acciones del paso 2
  // -------------------------------------------------------------------------

  abrirPlaystation(): void {
    window.open(URL_PLAYSTATION, '_blank', 'noopener');
  }

  abrirCodigo(): void {
    window.open(URL_CODIGO, '_blank', 'noopener');
  }

  // -------------------------------------------------------------------------
  // Paso 3
  // -------------------------------------------------------------------------

  alEscribir(valor: string): void {
    this.codigo.set(this.limpiar(valor));
    this.error.set(null);
  }

  /**
   * Tolera las tres formas en que la gente pega esto:
   * el JSON entero, el valor entre comillas, o el valor limpio.
   */
  private limpiar(bruto: string): string {
    const texto = bruto.trim();

    const desdeJson = texto.match(/"npsso"\s*:\s*"([^"]+)"/);
    if (desdeJson) return desdeJson[1];

    return texto.replace(/^["']|["']$/g, '').replace(/\s+/g, '');
  }

  async conectar(): Promise<void> {
    if (!this.codigoCompleto() || this.conectando()) return;

    this.conectando.set(true);
    this.error.set(null);

    try {
      await this.authService.linkPsn({ npsso: this.codigo() });

      // La primera sincronización arranca sola y sigue aunque cierren la app.
      this.syncService.start().catch(() => {
        /* el dashboard muestra el estado; acá no bloqueamos */
      });

      this.router.navigate(['/inicio']);
    } catch (error) {
      this.error.set(this.leerError(error));
    } finally {
      this.conectando.set(false);
    }
  }

  private leerError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Revisá tu conexión.';
      }
      if (error.status === 400) {
        return 'Sony rechazó el código. Puede estar vencido o incompleto: repetí el paso 2 y copialo de nuevo.';
      }
      if (typeof error.error?.error === 'string') {
        return error.error.error;
      }
    }
    return 'No se pudo conectar la cuenta. Probá de nuevo.';
  }
}
