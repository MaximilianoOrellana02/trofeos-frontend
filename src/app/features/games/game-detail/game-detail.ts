import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { GamesService } from '../../../core/services/games.service';
import { GameDetailResponse, TrophyDetail, TrophyType } from '../../../core/models/api.models';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

type FiltroTrofeos = 'todos' | 'obtenidos' | 'faltan';

/** Etiquetas de rareza en femenino, como las usa el diseño. */
const RAREZA: Record<string, string> = {
  'ultra-rare': 'ultra rara',
  'very-rare': 'muy rara',
  rare: 'rara',
  common: 'común',
};

const CLASE_RAREZA: Record<string, string> = {
  'ultra-rare': 'rareza-ultra-raro',
  'very-rare': 'rareza-muy-raro',
  rare: 'rareza-raro',
  common: 'rareza-comun',
};

const NOMBRE_METAL: Record<TrophyType, string> = {
  bronze: 'bronce',
  silver: 'plata',
  gold: 'oro',
  platinum: 'platino',
};

@Component({
  selector: 'app-game-detail',
  imports: [DecimalPipe, DatePipe, RouterLink],
  templateUrl: './game-detail.html',
  styleUrl: './game-detail.css',
})

export class GameDetail implements OnInit {
  private gamesService = inject(GamesService)
  id = input.required<string>();

  data = signal<GameDetailResponse | null>(null)
  cargando = signal(false)
  filtro = signal<FiltroTrofeos>('todos')

  ngOnInit(): void {
    this.cargando.set(true)
    this.cargarJuego()
  }

  cargarJuego() {

    this.gamesService.getGame(this.id()).subscribe({
      next: (response) => {
        this.data.set(response);
        this.cargando.set(false)
      },
      error: (e) => {
        console.error(e);
        this.cargando.set(false)
      }
    })
  }

  // -------------------------------------------------------------------------
  // Conteos
  // -------------------------------------------------------------------------

  readonly trofeos = computed(() => this.data()?.trophies ?? []);

  readonly totales = computed(() => {
    const lista = this.trofeos();
    const obtenidos = lista.filter((t) => t.earned).length;
    return {
      todos: lista.length,
      obtenidos,
      faltan: lista.length - obtenidos,
    };
  });

  /** Trofeos obtenidos agrupados por metal, para la línea de resumen. */
  readonly obtenidosPorMetal = computed(() => {
    const orden: TrophyType[] = ['bronze', 'silver', 'gold', 'platinum'];
    const lista = this.trofeos();

    return orden
      .map((tipo) => ({
        tipo,
        nombre: NOMBRE_METAL[tipo],
        cantidad: lista.filter((t) => t.type === tipo && t.earned).length,
      }))
      .filter((m) => m.cantidad > 0);
  });

  /**
   * Segmentos de la barra: cada metal ocupa un ancho proporcional a los
   * trofeos obtenidos de ese tipo sobre el total del juego.
   */
  readonly segmentos = computed(() => {
    const total = this.totales().todos;
    if (!total) return [];

    return this.obtenidosPorMetal().map((m) => ({
      tipo: m.tipo,
      porcentaje: (m.cantidad / total) * 100,
    }));
  });

  readonly porcentajeSinGanar = computed(() => {
    const { todos, faltan } = this.totales();
    return todos ? (faltan / todos) * 100 : 100;
  });

  /** El platino del juego, si existe. */
  readonly platino = computed(
    () => this.trofeos().find((t) => t.type === 'platinum') ?? null
  );

  // -------------------------------------------------------------------------
  // Lista filtrada
  // -------------------------------------------------------------------------

  readonly trofeosVisibles = computed(() => {
    const filtro = this.filtro();
    const lista = this.trofeos();

    if (filtro === 'obtenidos') return lista.filter((t) => t.earned);
    if (filtro === 'faltan') return lista.filter((t) => !t.earned);
    return lista;
  });

  // -------------------------------------------------------------------------
  // Presentación
  // -------------------------------------------------------------------------

  /** Escalón de rareza. Los umbrales son los mismos que usa el resto de la app. */
  private nivelRareza(rarity: number | null): string {
    if (rarity === null) return 'common';
    if (rarity <= 5) return 'ultra-rare';
    if (rarity <= 10) return 'very-rare';
    if (rarity <= 25) return 'rare';
    return 'common';
  }

  etiquetaRareza(t: TrophyDetail): string {
    const base = RAREZA[this.nivelRareza(t.rarity)];
    // Un trofeo oculto no obtenido igual muestra su rareza, precedida del aviso
    return t.isHidden && !t.earned ? `oculta · ${base}` : base;
  }

  claseRareza(rarity: number | null): string {
    return CLASE_RAREZA[this.nivelRareza(rarity)];
  }

  /** Sony puede mandar "PS4,PS5": mostramos la generación más nueva. */
  plataformaPrincipal(platform: string): string {
    const lista = platform
      .split(',')
      .map((p) => p.trim().toUpperCase().replace(/\s+/g, ''));

    for (const p of ['PS5', 'PS4', 'PS3', 'PSVITA']) {
      if (lista.includes(p)) return p === 'PSVITA' ? 'PS VITA' : p;
    }
    return lista[0] ?? '';
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

  colorFondo(nombre: string): string {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 32%, 32%)`;
  }

  ocultarImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }

  marcandoMeta = signal(false);

  toggleMeta(): void {
    const actual = this.data();
    if (!actual || this.marcandoMeta()) return;

    const nuevoValor = !actual.game.isGoal;
    this.marcandoMeta.set(true);

    this.gamesService.toggleGoal(this.id(), nuevoValor).subscribe({
      next: () => {
        // Actualizamos el signal sin perder el resto del objeto
        this.data.update((d) =>
          d ? { ...d, game: { ...d.game, isGoal: nuevoValor } } : d
        );
        this.marcandoMeta.set(false);
      },
      error: (e) => {
        console.error(e);
        this.marcandoMeta.set(false);
      },
    });
  }

}
