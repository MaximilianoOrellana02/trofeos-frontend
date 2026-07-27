import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface Tab {
  ruta: string;
  etiqueta: string;
  icono: 'inicio' | 'juegos' | 'stats' | 'amigos' | 'ajustes';
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly tabs: Tab[] = [
    { ruta: '/inicio', etiqueta: 'Inicio', icono: 'inicio' },
    { ruta: '/juegos', etiqueta: 'Juegos', icono: 'juegos' },
    { ruta: '/estadisticas', etiqueta: 'Stats', icono: 'stats' },
    { ruta: '/amigos', etiqueta: 'Amigos', icono: 'amigos' },
    { ruta: '/ajustes', etiqueta: 'Ajustes', icono: 'ajustes' },
  ];
}
