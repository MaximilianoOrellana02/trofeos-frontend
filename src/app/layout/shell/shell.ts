import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TrophyCelebration } from "../../features/trophy-celebration/trophy-celebration";
import { SyncService } from '../../core/services/sync.service';

interface Tab {
  ruta: string;
  etiqueta: string;
  icono: 'inicio' | 'juegos' | 'stats' | 'metas' | 'ajustes';
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TrophyCelebration],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private syncService = inject(SyncService)

  constructor() {
    this.syncService.buscarTrofeosNuevos()
  }

  readonly tabs: Tab[] = [
    { ruta: '/inicio', etiqueta: 'Inicio', icono: 'inicio' },
    { ruta: '/juegos', etiqueta: 'Juegos', icono: 'juegos' },
    { ruta: '/estadisticas', etiqueta: 'Stats', icono: 'stats' },
    { ruta: '/metas', etiqueta: 'Metas', icono: 'metas' },
    { ruta: '/ajustes', etiqueta: 'Ajustes', icono: 'ajustes' },
  ];

}
