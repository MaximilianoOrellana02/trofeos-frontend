import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { GamesService } from '../../../core/services/games.service';
import { GameListItem } from '../../../core/models/api.models';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from "@angular/router";

type Orden = 'ultimo' | 'progreso' | 'nombre'

interface Filtro {
  clave: string;
  etiqueta: string
}

@Component({
  selector: 'app-game-list',
  imports: [DecimalPipe, DatePipe, RouterLink],
  templateUrl: './game-list.html',
  styleUrl: './game-list.css',
})
export class GameList implements OnInit {
  private gamesService = inject(GamesService);

  allGames = signal<GameListItem[]>([])
  cargando = signal(false)

  busqueda = signal('');
  filtro = signal('todas')
  orden = signal<Orden>('ultimo')

  readonly filtros: Filtro[] = [
    { clave: 'todas', etiqueta: 'Todas' },
    { clave: 'PS5', etiqueta: 'PS5' },
    { clave: 'PS4', etiqueta: 'PS4' },
    { clave: 'PS3', etiqueta: 'PS3' },
    { clave: 'PSVITA', etiqueta: 'PS Vita' },
    { clave: 'sinplat', etiqueta: 'Sin plat' },
  ];

  readonly resumen = computed(() => {
    const juegos = this.allGames();

    return {
      total: juegos.length,
      platinados: juegos.filter((j) => j.earned.platinum > 0).length
    }
  })

  /** Lista final: filtrada por texto, por plataforma y ordenada. */
  readonly juegosVisibles = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtro = this.filtro();
    const orden = this.orden();

    let lista = this.allGames();

    if (texto) {
      lista = lista.filter((j) => j.name.toLowerCase().includes(texto));
    }

    if (filtro === 'sinplat') {
      lista = lista.filter((j) => j.total.platinum > 0 && j.earned.platinum === 0);
    } else if (filtro !== 'todas') {
      lista = lista.filter((j) => this.plataformas(j.platform).includes(filtro));
    }

    return [...lista].sort((a, b) => {
      if (orden === 'nombre') return a.name.localeCompare(b.name, 'es');
      if (orden === 'progreso') return b.progress - a.progress;
      return this.fecha(b.lastPlayedAt) - this.fecha(a.lastPlayedAt);
    });
  });

  ngOnInit(): void {
    this.cargarJuegos()
  }

  cargarJuegos() {
    this.gamesService.getAllGames().subscribe({
      next: (response) => {
        this.allGames.set(response),
          console.log(this.allGames());
      },
      error: (e) => {
        console.error(e);
      }
    })
  }


  //Calculos de presentacion

  obtenidos(j: GameListItem): number {
    return j.earned.bronze + j.earned.silver + j.earned.gold + j.earned.platinum;
  }


  totales(j: GameListItem): number {
    return j.total.bronze + j.total.silver + j.total.gold + j.total.platinum;
  }

  /** Sony puede mandar "PS4,PS5". Normalizamos a un array limpio. */
  plataformas(platform: string): string[] {
    return platform
      .split(',')
      .map((p) => p.trim().toUpperCase().replace(/\s+/g, ''))
      .filter(Boolean);
  }

  /**
   * Cuando un juego está en varias plataformas mostramos la más nueva,
   * que es la que el jugador probablemente usó.
   */
  plataformaPrincipal(platform: string): string {
    const jerarquia = ['PS5', 'PS4', 'PS3', 'PSVITA', 'PSPC'];
    const lista = this.plataformas(platform);

    for (const p of jerarquia) {
      if (lista.includes(p)) return p === 'PSVITA' ? 'PS VITA' : p;
    }
    return lista[0] ?? '';
  }

  /** Iniciales para el cuadrito cuando el ícono de Sony no carga. */
  iniciales(nombre: string): string {
    return nombre
      .replace(/[^\p{L}\p{N} ]/gu, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  /** Color estable derivado del nombre: el mismo juego siempre tiene el mismo. */
  colorFondo(nombre: string): string {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 32%, 32%)`;
  }

  private fecha(valor: string | null): number {
    return valor ? new Date(valor).getTime() : 0;
  }

  // -------------------------------------------------------------------------
  // Interacción
  // -------------------------------------------------------------------------

  alBuscar(valor: string): void {
    this.busqueda.set(valor);
  }

  ocultarImagen(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}
