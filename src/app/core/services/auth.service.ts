import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment.development";
import { AuthResponse, CredentialsRequest, CurrentUser, PsnLinkRequest, PsnLinkResponse } from "../models/api.models";
import { firstValueFrom } from "rxjs";

const TOKEN_KEY = 'psn_token'

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private readonly http = inject(HttpClient);
    private router = inject(Router);
    private api = environment.apiUrl;


    //Estado Reactivo
    private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY))
    readonly currentUser = signal<CurrentUser | null>(null);
    readonly loadingUser = signal(false);

    readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
    readonly psnLinked = computed(() => this.currentUser()?.psnLinked ?? false);

    get token(): string | null {
        return this.tokenSignal();
    }

    async login(credentials: CredentialsRequest): Promise<void> {
        const res = await firstValueFrom(
            this.http.post<AuthResponse>(`${this.api}/auth/login`, credentials)
        );
        this.setToken(res.token);
        await this.loadCurrentUser();
    }

    async register(credentials: CredentialsRequest): Promise<void> {
        const res = await firstValueFrom(
            this.http.post<AuthResponse>(`${this.api}/auth/register`, credentials)
        );
        this.setToken(res.token);
        await this.loadCurrentUser();
    }

    /** Trae el perfil desde /auth/me. Se llama al iniciar sesión y al arrancar la app. */
    async loadCurrentUser(): Promise<CurrentUser | null> {
        if (!this.tokenSignal()) return null;

        this.loadingUser.set(true);
        try {
            const user = await firstValueFrom(
                this.http.get<CurrentUser>(`${this.api}/auth/me`)
            );
            this.currentUser.set(user);
            return user;
        } catch {
            // Token inválido o backend caído: cerramos sesión
            this.logout(false);
            return null;
        } finally {
            this.loadingUser.set(false);
        }
    }

    async linkPsn(data: PsnLinkRequest): Promise<PsnLinkResponse> {
        const res = await firstValueFrom(
            this.http.post<PsnLinkResponse>(`${this.api}/auth/psn/link`, data)
        );
        await this.loadCurrentUser();
        return res;
    }

    logout(redirect = true): void {
        localStorage.removeItem(TOKEN_KEY);
        this.tokenSignal.set(null);
        this.currentUser.set(null);
        if (redirect) this.router.navigate(['/login']);
    }

    private setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        this.tokenSignal.set(token);
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await firstValueFrom(
            this.http.put(`${this.api}/auth/password`, { currentPassword, newPassword })
        );
    }
}

