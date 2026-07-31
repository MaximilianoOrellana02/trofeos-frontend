import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Stats } from '../stats/stats';
import { Tema, ThemeService } from '../../core/services/theme.service';
import { StatsService } from '../../core/services/stats.service';
import { NotificationService } from '../../core/services/trophy-celebration.service';

const DURACION_NPSSO_DIAS = 60;

@Component({
  selector: 'app-settings',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  auth = inject(AuthService);
  private statsService = inject(StatsService);
  theme = inject(ThemeService);

  confirmandoSalida = signal(false)

  ngOnInit(): void {
    if (!this.statsService.stats()) {
      this.statsService.cargar()
    }
  }

  readonly totalTrofeos = computed(
    () => this.statsService.stats()?.totals.trophiesEarned ?? null
  );

  /** Días restantes hasta que el NPSSO venza. null = nunca se vinculó con este dato. */
  readonly diasRestantes = computed(() => {
    const vinculadoEl = this.auth.currentUser()?.psnNpssoLinkedAt;
    if (!vinculadoEl) return null;

    const dias = Math.floor(
      (Date.now() - new Date(vinculadoEl).getTime()) / 86_400_000
    );
    return Math.max(DURACION_NPSSO_DIAS - dias, 0);
  });

  readonly progresoVencimiento = computed(() => {
    const restantes = this.diasRestantes();
    if (restantes === null) return 100;
    return ((DURACION_NPSSO_DIAS - restantes) / DURACION_NPSSO_DIAS) * 100;
  });

  readonly vencido = computed(() => this.diasRestantes() === 0);

  /** Iniciales para el avatar de fallback. */
  iniciales(nombre: string | null | undefined): string {
    if (!nombre) return 'PS';
    return nombre.slice(0, 2).toUpperCase();
  }

  elegirTema(tema: Tema): void {
    this.theme.set(tema);
  }

  pedirConfirmacionSalida(): void {
    this.confirmandoSalida.set(true);
  }

  cancelarSalida(): void {
    this.confirmandoSalida.set(false);
  }

  confirmarSalida(): void {
    this.auth.logout();
  }

  ocultarImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }

  notifications = inject(NotificationService);

  async activarNotificaciones(): Promise<void> {
    await this.notifications.pedirPermiso();
  }
}
