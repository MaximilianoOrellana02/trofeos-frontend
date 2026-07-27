import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SyncStartResponse, SyncStatus } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SyncService {
    private http = inject(HttpClient);
    private api = environment.apiUrl;

    readonly isSyncing = signal(false);
    readonly lastSyncAt = signal<string | null>(null);
    readonly lastError = signal<string | null>(null);

    private pollHandle: ReturnType<typeof setInterval> | null = null;

    /**
     * Dispara la sincronización. El backend responde 202 y sigue trabajando en
     * segundo plano, así que arrancamos el sondeo del estado.
     */
    async start(force = false): Promise<void> {
        this.lastError.set(null);
        try {
            await firstValueFrom(
                this.http.post<SyncStartResponse>(`${this.api}/sync`, { force })
            );
            this.isSyncing.set(true);
            this.startPolling();
        } catch (error: any) {
            // 429 = throttled, 409 = ya hay una corriendo. No son fallas reales.
            if (error?.status === 409) {
                this.isSyncing.set(true);
                this.startPolling();
                return;
            }
            this.lastError.set(error?.error?.error ?? 'No se pudo sincronizar.');
            throw error;
        }
    }

    /** Consulta el estado una sola vez. */
    async checkStatus(): Promise<SyncStatus> {
        const status = await firstValueFrom(
            this.http.get<SyncStatus>(`${this.api}/sync/status`)
        );
        this.isSyncing.set(status.isSyncing);
        this.lastSyncAt.set(status.lastFullSyncAt);
        return status;
    }

    /** Sondea cada 3 segundos hasta que el backend avise que terminó. */
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