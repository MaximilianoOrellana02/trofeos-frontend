import { Injectable, signal } from "@angular/core";

export type Tema = 'dark' | 'light';

const CLAVE = 'psn_tema';

@Injectable({
    providedIn: 'root'
})

export class ThemeService {
    readonly tema = signal<Tema>(this.leerGuardado())

    constructor() {
        this.aplicar(this.tema())
    }

    set(tema: Tema): void {
        this.tema.set(tema);
        localStorage.setItem(CLAVE, tema);
        this.aplicar(tema)
    }

    private aplicar(tema: Tema): void {
        document.documentElement.setAttribute('data-bs-theme', tema)
    }

    private leerGuardado(): Tema {
        const guardado = localStorage.getItem(CLAVE);
        return guardado === 'light' ? 'light' : 'dark';
    }
}