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
      { tipo: 'platino.png' as TrophyType, cantidad: s.earned?.platinum ?? 0, nombre: 'Platino' },
      { tipo: 'oro.png' as TrophyType, cantidad: s.earned?.gold ?? 0, nombre: 'Oro' },
      { tipo: 'plata.png' as TrophyType, cantidad: s.earned?.silver ?? 0, nombre: 'Plata' },
      { tipo: 'bronce.png' as TrophyType, cantidad: s.earned?.bronze ?? 0, nombre: 'Bronce' },
    ];
  });

  readonly completitud = computed(() => this.stats()?.totals?.completionRate ?? 0);
  readonly recentTrophies = computed(() => this.stats()?.recentTrophies?.slice(0, 5) ?? []);
  readonly rarestTrophies = computed(() => this.stats()?.rarestTrophies?.slice(0, 5) ?? []);

  private sincronizabaAntes = false;

  constructor() {
    this.statsService.cargar();

    effect(() => {
      const sincronizandoAhora = this.sincronizando();

      untracked(() => {
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
