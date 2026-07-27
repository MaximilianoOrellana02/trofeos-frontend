import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TiempoRelativoPipe } from '../../shared/pipes/tiempo-relativo.pipe';
import { StatsService } from '../../core/services/stats.service';
import { SyncService } from '../../core/services/sync.service';
import { getRarityTier, RARITY_CLASSES, TROPHY_CLASSES, TROPHY_LABELS, TrophyType } from '../../core/models/api.models';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, RouterLink, TiempoRelativoPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private statsService = inject(StatsService);
  private syncService = inject(SyncService);

  readonly stats = this.statsService.stats;
  readonly cargando = this.statsService.cargando;
  readonly error = this.statsService.error;
  readonly sincronizando = this.syncService.isSyncing;

  readonly avisoSync = signal<string | null>(null);

  /** Los cuatro metales en el orden del diseño: el platino manda. */
  readonly metales = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { tipo: 'platinum' as TrophyType, cantidad: s.earned?.platinum ?? 0 },
      { tipo: 'gold' as TrophyType, cantidad: s.earned?.gold ?? 0 },
      { tipo: 'silver' as TrophyType, cantidad: s.earned?.silver ?? 0 },
      { tipo: 'bronze' as TrophyType, cantidad: s.earned?.bronze ?? 0 },
    ];
  });

  /** Separa el porcentaje en parte entera y decimal para maquetarlo distinto. */
  readonly completitud = computed(() => this.stats()?.totals?.completionRate ?? 0);

  private sincronizabaAntes = false;

  constructor() {
    this.statsService.cargar();

    // Solo depende de sincronizando(). Todo lo demás va en untracked
    // para no volverse dependencia del effect.
    effect(() => {
      const sincronizandoAhora = this.sincronizando();

      untracked(() => {
        // Recargamos únicamente en la transición de "sincronizando" a "listo"
        if (this.sincronizabaAntes && !sincronizandoAhora) {
          this.statsService.cargar();
        }
        this.sincronizabaAntes = sincronizandoAhora;
      });
    });
  }

  async sincronizar(): Promise<void> {
    this.avisoSync.set(null);
    try {
      await this.syncService.start();
    } catch (error: any) {
      if (error?.status === 429) {
        this.avisoSync.set(error.error?.error ?? 'Recién sincronizaste. Esperá un poco.');
      } else {
        this.avisoSync.set('No se pudo sincronizar. Probá de nuevo.');
      }
    }
  }

  /** Fallback cuando el ícono de Sony no carga: mostramos iniciales. */
  iniciales(nombre: string): string {
    return nombre
      .replace(/[^\p{L}\p{N} ]/gu, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  claseMetal(tipo: TrophyType): string {
    return TROPHY_CLASSES[tipo];
  }

  etiquetaMetal(tipo: TrophyType): string {
    return TROPHY_LABELS[tipo];
  }

  claseRareza(rarity: number | null): string {
    return RARITY_CLASSES[getRarityTier(rarity)];
  }

  ocultarImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}
