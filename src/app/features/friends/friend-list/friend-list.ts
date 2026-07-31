import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FriendService } from '../../../core/services/friend.service';
import { FriendListItem, GoalGame, SuggestedGame } from '../../../core/models/api.models';
import { GamesService } from '../../../core/services/games.service';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-friend-list',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './friend-list.html',
  styleUrl: './friend-list.css',
})
export class FriendList implements OnInit {
  private gamesService = inject(GamesService)

  metas = signal<GoalGame[]>([]);
  enProgreso = signal<SuggestedGame[]>([]);
  sinEmpezar = signal<SuggestedGame[]>([]);

  mostrarMasEnProgreso = signal(false);
  mostrarMasSinEmpezar = signal(false);

  readonly enProgresoVisibles = computed(() =>
    this.mostrarMasEnProgreso() ? this.enProgreso() : this.enProgreso().slice(0, 5)
  );

  readonly sinEmpezarVisibles = computed(() =>
    this.mostrarMasSinEmpezar() ? this.sinEmpezar() : this.sinEmpezar().slice(0, 5)
  );

  cargando = signal(false);
  procesando = signal<string | null>(null); // id del juego con una request en curso

  ngOnInit(): void {
    this.cargarTodo();
  }

  private cargarTodo(): void {
    this.cargando.set(true);

    this.gamesService.getGoals().subscribe({
      next: (r) => this.metas.set(r),
      error: () => this.metas.set([]),
    });

    this.gamesService.getSuggestions().subscribe({
      next: (r) => {
        this.enProgreso.set(r.enProgreso);
        this.sinEmpezar.set(r.sinEmpezar);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  toggleVerMasEnProgreso(): void {
    this.mostrarMasEnProgreso.update((v) => !v);
  }

  toggleVerMasSinEmpezar(): void {
    this.mostrarMasSinEmpezar.update((v) => !v);
  }

  /** Marca un sugerido como meta: lo saca de sugeridos y lo suma a metas. */
  agregarMeta(juego: SuggestedGame): void {
    if (this.procesando()) return;
    this.procesando.set(juego.id);

    this.gamesService.toggleGoal(juego.id, true).subscribe({
      next: () => {
        this.enProgreso.update((lista) => lista.filter((j) => j.id !== juego.id));
        this.sinEmpezar.update((lista) => lista.filter((j) => j.id !== juego.id));
        this.metas.update((lista) => [
          ...lista,
          {
            id: juego.id,
            name: juego.name,
            iconUrl: juego.iconUrl,
            platform: juego.platform,
            progress: juego.progress,
            earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
          },
        ]);
        this.procesando.set(null);
      },
      error: () => this.procesando.set(null),
    });
  }

  /** Saca un juego de metas. No lo vuelve a poner en sugeridos automáticamente. */
  quitarMeta(juego: GoalGame): void {
    if (this.procesando()) return;
    this.procesando.set(juego.id);

    this.gamesService.toggleGoal(juego.id, false).subscribe({
      next: () => {
        this.metas.update((lista) => lista.filter((j) => j.id !== juego.id));
        this.procesando.set(null);
      },
      error: () => this.procesando.set(null),
    });
  }

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

}
