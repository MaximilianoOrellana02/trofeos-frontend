import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Bloquea rutas si no hay sesión iniciada. */
export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isAuthenticated()) return true;

    router.navigate(['/login']);
    return false;
};

/** Bloquea rutas que necesitan la cuenta de PSN vinculada. */
export const psnLinkedGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Si todavía no cargamos el perfil (ej. refresh de página), lo pedimos ahora
    if (!auth.currentUser()) {
        await auth.loadCurrentUser();
    }

    if (auth.psnLinked()) return true;

    router.navigate(['/vincular']);
    return false;
};

/** Evita que un usuario logueado vuelva al login. */
export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) return true;

    router.navigate(['/inicio']);
    return false;
};