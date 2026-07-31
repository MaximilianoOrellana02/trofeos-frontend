import { Routes } from '@angular/router';
import { authGuard, guestGuard, psnLinkedGuard } from './core/guards/auth.guard';
import lo from '@angular/common/locales/lo';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login')
            .then((m) => m.Login)
    },
    {
        path: 'vincular',
        canActivate: [authGuard],
        loadComponent: () => import('./features/auth/link-psn/link-psn')
            .then((m) => m.LinkPsn)
    },
    {
        //SHELL
        path: '',
        canActivate: [authGuard, psnLinkedGuard],
        loadComponent: () =>
            import('./layout/shell/shell').then((m) => m.Shell),
        children: [
            {
                path: 'inicio',
                loadComponent: () => import('./features/dashboard/dashboard')
                    .then((m) => m.Dashboard)
            },
            {
                path: 'juegos',
                loadComponent: () => import('./features/games/game-list/game-list')
                    .then((m) => m.GameList)
            },
            {
                path: 'juegos/:id',
                loadComponent: () => import('./features/games/game-detail/game-detail')
                    .then((m) => m.GameDetail)
            },
            {
                path: 'juegos/:id/guia',
                loadComponent: () => import('./features/games/game-guide/game-guide')
                    .then((m) => m.GameGuide)
            },
            {
                path: 'estadisticas',
                loadComponent: () => import('./features/stats/stats')
                    .then((m) => m.Stats)
            },
            {
                path: 'metas',
                loadComponent: () => import('./features/friends/friend-list/friend-list')
                    .then((m) => m.FriendList)
            },
            {
                path: 'ajustes',
                loadComponent: () => import('./features/settings/settings')
                    .then((m) => m.Settings)
            },
            {
                path: 'ajustes/contrasena',
                loadComponent: () => import('./features/change-password/change-password')
                    .then((m) => m.ChangePassword)
            },
            { path: '', redirectTo: 'inicio', pathMatch: 'full' },
        ],
    }, { path: '**', redirectTo: '' }
];
