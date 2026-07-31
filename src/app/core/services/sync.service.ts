import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NewTrophy, SyncStartResponse, SyncStatus } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SyncService {
    private http = inject(HttpClient);
    private api = environment.apiUrl;

    readonly isSyncing = signal(false);
    readonly lastSyncAt = signal<string | null>(null);
    readonly lastError = signal<string | null>(null);

    /** Trofeos detectados en la última sincronización, listos para mostrar. */
    readonly nuevosTrofeos = signal<NewTrophy[]>([]);

    private pollHandle: ReturnType<typeof setInterval> | null = null;
    private sincronizabaAntes = false;

    async start(force = false): Promise<void> {
        this.lastError.set(null);
        try {
            await firstValueFrom(
                this.http.post<SyncStartResponse>(`${this.api}/sync`, { force })
            );
            this.isSyncing.set(true);
            this.sincronizabaAntes = true;
            this.startPolling();
        } catch (error: any) {
            if (error?.status === 409) {
                this.isSyncing.set(true);
                this.sincronizabaAntes = true;
                this.startPolling();
                return;
            }
            this.lastError.set(error?.error?.error ?? 'No se pudo sincronizar.');
            throw error;
        }
    }

    async checkStatus(): Promise<SyncStatus> {
        const status = await firstValueFrom(
            this.http.get<SyncStatus>(`${this.api}/sync/status`)
        );

        const terminoAhora = this.sincronizabaAntes && !status.isSyncing;

        this.isSyncing.set(status.isSyncing);
        this.lastSyncAt.set(status.lastFullSyncAt);
        this.sincronizabaAntes = status.isSyncing;

        // La transición de "sincronizando" a "listo" es el único momento
        // en que vale la pena preguntar por trofeos nuevos.
        if (terminoAhora) {
            this.buscarTrofeosNuevos();
        }

        return status;
    }

    /** Se puede llamar también al arrancar la app, por si una sync de otra sesión terminó. */
    async buscarTrofeosNuevos(): Promise<void> {
        try {
            const nuevos = await firstValueFrom(
                this.http.get<NewTrophy[]>(`${this.api}/sync/new-trophies`)
            );
            if (nuevos.length) this.nuevosTrofeos.set(nuevos);
        } catch {
            // Si falla, no perdemos nada crítico: el usuario los va a ver
            // reflejados igual la próxima vez que entre al juego.
        }
    }

    /** El componente que los muestra llama a esto cuando el usuario ya los vio. */
    limpiarNuevosTrofeos(): void {
        this.nuevosTrofeos.set([]);
    }

    private startPolling(): void {
        this.stopPolling();
        this.pollHandle = setInterval(async () => {
            try {
                const status = await this.checkStatus();
                if (!status.isSyncing) this.stopPolling();
            } catch {
                this.stopPolling();
            }
        }, 3000);
    }

    stopPolling(): void {
        if (this.pollHandle) {
            clearInterval(this.pollHandle);
            this.pollHandle = null;
        }
    }
}