import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GameListItem, TrophyType } from '../../core/models/api.models';
import { StatsService } from '../../core/services/stats.service';
import { GamesService } from '../../core/services/games.service';

interface BarraTimeline {
  mes: string;
  etiqueta: string;
  total: number;
  platino: number;
  alturaTotal: number;
  alturaPlatino: number;
}

interface BarraPlataforma {
  plataforma: string;
  juegos: number;
  ancho: number;
}

const NOMBRE_METAL: Record<TrophyType, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  platinum: 'Platino',
};

const JERARQUIA_PLATAFORMAS = ['PS5', 'PS4', 'PS3', 'PSVITA'];

@Component({
  selector: 'app-stats',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './stats.html',
  styleUrl: './stats.css',
})
export class Stats implements OnInit {
  private statsService = inject(StatsService);
  private gamesService = inject(GamesService);

  stats = this.statsService.stats;
  timeline = this.statsService.timeline;
  cargando = this.statsService.cargando;

  private juegos = signal<GameListItem[]>([]);

  ngOnInit(): void {
    if (!this.stats()) this.statsService.cargar();

    this.statsService.cargarTimeline()

    this.gamesService.getAllGames().subscribe({
      next: (r) => this.juegos.set(r),
      error: () => this.juegos.set([]),
    });
  }

  // -------------------------------------------------------------------------
  // Distribución de metales
  // -------------------------------------------------------------------------

  readonly metales = computed(() => {
    const s = this.stats();
    if (!s) return [];

    const orden: TrophyType[] = ['bronze', 'silver', 'gold', 'platinum'];
    return orden.map((tipo) => ({
      tipo,
      nombre: NOMBRE_METAL[tipo],
      obtenidos: s.earned[tipo],
      total: s.defined[tipo],
      // ancho de la barra: proporción de lo obtenido sobre lo existente
      porcentaje: s.defined[tipo] ? (s.earned[tipo] / s.defined[tipo]) * 100 : 0,
    }));
  });

  // -------------------------------------------------------------------------
  // Timeline mensual
  // -------------------------------------------------------------------------

  readonly barrasTimeline = computed<BarraTimeline[]>(() => {
    const puntos = this.timeline();
    if (!puntos.length) return [];

    // Solo los últimos 12 meses con datos, para que el gráfico no se aplaste
    const recientes = puntos.slice(-12);
    const maximo = Math.max(...recientes.map((p) => p.total), 1);

    return recientes.map((p) => ({
      mes: p.month,
      etiqueta: this.etiquetaMes(p.month),
      total: p.total,
      platino: p.platinum,
      alturaTotal: (p.total / maximo) * 100,
      alturaPlatino: (p.platinum / maximo) * 100,
    }));
  });

  readonly mesConMasTrofeos = computed(() => {
    const barras = this.barrasTimeline();
    if (!barras.length) return null;
    return barras.reduce((max, b) => (b.total > max.total ? b : max));
  });

  private etiquetaMes(valor: string): string {
    const [anio, mes] = valor.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, 1);
    return fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
  }

  // -------------------------------------------------------------------------
  // Distribución por plataforma
  // -------------------------------------------------------------------------

  readonly barrasPlataforma = computed<BarraPlataforma[]>(() => {
    const juegos = this.juegos();
    if (!juegos.length) return [];

    const conteo = new Map<string, number>();
    for (const j of juegos) {
      const principal = this.plataformaPrincipal(j.platform);
      conteo.set(principal, (conteo.get(principal) ?? 0) + 1);
    }

    const maximo = Math.max(...conteo.values(), 1);

    return JERARQUIA_PLATAFORMAS.filter((p) => conteo.has(p)).map((p) => ({
      plataforma: p === 'PSVITA' ? 'PS Vita' : p,
      juegos: conteo.get(p) ?? 0,
      ancho: ((conteo.get(p) ?? 0) / maximo) * 100,
    }));
  });

  private plataformaPrincipal(platform: string): string {
    const lista = platform
      .split(',')
      .map((p) => p.trim().toUpperCase().replace(/\s+/g, ''));

    for (const p of JERARQUIA_PLATAFORMAS) {
      if (lista.includes(p)) return p;
    }
    return lista[0] ?? '';
  }

  // -------------------------------------------------------------------------
  // Presentación de la lista de raros
  // -------------------------------------------------------------------------

  claseRareza(rarity: number | null): string {
    if (rarity === null) return 'rareza-comun';
    if (rarity <= 5) return 'rareza-ultra-raro';
    if (rarity <= 10) return 'rareza-muy-raro';
    if (rarity <= 25) return 'rareza-raro';
    return 'rareza-comun';
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

  ocultarImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}
