import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dificultad, GameDetailResponse, GuideResponse, TrophyDetail } from '../../../core/models/api.models';
import { GamesService } from '../../../core/services/games.service';

const ETIQUETA_DIFICULTAD: Record<Dificultad, string> = {
  trivial: 'trivial',
  facil: 'fácil',
  media: 'media',
  dificil: 'difícil',
  muy_dificil: 'muy difícil',
};

@Component({
  selector: 'app-game-guide',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './game-guide.html',
  styleUrl: './game-guide.css',
})
export class GameGuide {
  private gamesService = inject(GamesService);

  id = input.required<string>();

  detalle = signal<GameDetailResponse | null>(null);
  guia = signal<GuideResponse | null>(null);

  cargandoDetalle = signal(false);
  cargandoGuia = signal(false);
  error = signal<string | null>(null);

  /** Los trofeos completos, indexados por nombre, para mostrar ícono y rareza junto al consejo. */
  private trofeosPorNombre = computed(() => {
    const mapa = new Map<string, TrophyDetail>();
    for (const t of this.detalle()?.trophies ?? []) {
      mapa.set(t.name, t);
    }
    return mapa;
  });

  readonly faltantes = computed(
    () => this.detalle()?.trophies.filter((t) => !t.earned).length ?? 0
  );

  ngOnInit(): void {
    this.cargarDetalle();
    this.cargarGuia();
  }

  private cargarDetalle(): void {
    this.cargandoDetalle.set(true);
    this.gamesService.getGame(this.id()).subscribe({
      next: (r) => {
        this.detalle.set(r);
        this.cargandoDetalle.set(false);
      },
      error: () => this.cargandoDetalle.set(false),
    });
  }

  private cargarGuia(force = false): void {
    this.cargandoGuia.set(true);
    this.error.set(null);

    this.gamesService.getGuide(this.id(), force).subscribe({
      next: (r) => {
        this.guia.set(r);
        this.cargandoGuia.set(false);
      },
      error: (e) => {
        this.error.set(
          e?.status === 502
            ? 'No se pudo generar la guía. Probá de nuevo en un rato.'
            : 'Algo falló al pedir la guía.'
        );
        this.cargandoGuia.set(false);
      },
    });
  }

  reintentar(): void {
    this.cargarGuia();
  }

  regenerarGuia(): void {
    if (this.cargandoGuia()) return;
    this.cargarGuia(true);
  }

  // -------------------------------------------------------------------------
  // Presentación
  // -------------------------------------------------------------------------

  trofeo(nombre: string): TrophyDetail | undefined {
    return this.trofeosPorNombre().get(nombre);
  }

  etiquetaDificultad(d: Dificultad): string {
    return ETIQUETA_DIFICULTAD[d];
  }

  claseDificultad(d: Dificultad): string {
    return 'dificultad--' + d;
  }

  claseRareza(rarity: number | null | undefined): string {
    if (rarity == null) return 'rareza-comun';
    if (rarity <= 5) return 'rareza-ultra-raro';
    if (rarity <= 10) return 'rareza-muy-raro';
    if (rarity <= 25) return 'rareza-raro';
    return 'rareza-comun';
  }

  etiquetaRareza(rarity: number | null | undefined): string {
    if (rarity == null) return 'común';
    if (rarity <= 5) return 'ultra rara';
    if (rarity <= 10) return 'muy rara';
    if (rarity <= 25) return 'rara';
    return 'común';
  }

  ocultarImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}
