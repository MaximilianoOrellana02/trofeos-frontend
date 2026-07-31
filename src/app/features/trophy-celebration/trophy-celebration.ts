import { Component, computed, effect, inject } from '@angular/core';
import { SyncService } from '../../core/services/sync.service';
import { TrophyType } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/trophy-celebration.service';

const NOMBRE_METAL: Record<TrophyType, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  platinum: 'Platino',
};

@Component({
  selector: 'app-trophy-celebration',
  imports: [],
  templateUrl: './trophy-celebration.html',
  styleUrl: './trophy-celebration.css',
})
export class TrophyCelebration {
  private sync = inject(SyncService);
  private notifications = inject(NotificationService);

  readonly trofeos = this.sync.nuevosTrofeos;

  readonly platino = computed(
    () => this.trofeos().find((t) => t.trophyType === 'platinum') ?? null
  );

  readonly resto = computed(() =>
    this.trofeos().filter((t) => t.trophyType !== 'platinum')
  );

  constructor() {
    // Cuando llegan trofeos nuevos y la pestaña no está en foco,
    // avisamos también por notificación de sistema.
    effect(() => {
      const lista = this.trofeos();
      if (!lista.length || !document.hidden) return;

      const platino = lista.find((t) => t.trophyType === 'platinum');
      if (platino) {
        this.notifications.notificar('¡Platino! 🏆', `${platino.trophyName} — ${platino.gameName}`);
      } else if (lista.length === 1) {
        this.notifications.notificar('Nuevo trofeo', `${lista[0].trophyName} — ${lista[0].gameName}`);
      } else {
        this.notifications.notificar(`${lista.length} trofeos nuevos`, lista[0].gameName);
      }
    });
  }

  nombreMetal(tipo: TrophyType): string {
    return NOMBRE_METAL[tipo];
  }

  cerrar(): void {
    this.sync.limpiarNuevosTrofeos();
  }
}
