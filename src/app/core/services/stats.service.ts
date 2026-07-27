import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatsResponse, TimelinePoint } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class StatsService {
    private http = inject(HttpClient);
    private api = environment.apiUrl;

    readonly stats = signal<StatsResponse | null>(null);
    readonly timeline = signal<TimelinePoint[]>([]);
    readonly cargando = signal(false);
    readonly error = signal<string | null>(null);

    async cargar(): Promise<void> {
        this.cargando.set(true);
        this.error.set(null);

        try {
            const data = await firstValueFrom(
                this.http.get<StatsResponse>(`${this.api}/stats`)
            );
            this.stats.set(data);
        } catch (error: any) {
            this.error.set(error?.error?.error ?? 'No se pudieron cargar tus datos.');
        } finally {
            this.cargando.set(false);
        }
    }

    async cargarTimeline(): Promise<void> {
        try {
            const data = await firstValueFrom(
                this.http.get<TimelinePoint[]>(`${this.api}/stats/timeline`)
            );
            this.timeline.set(data);
        } catch {
            this.timeline.set([]);
        }
    }
}