import { Routes } from '@angular/router';
import { authGuard, guestGuard, psnLinkedGuard } from './core/guards/auth.guard';

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
                path: 'estadisticas',
                loadComponent: () => import('./features/stats/stats')
                    .then((m) => m.Stats)
            },
            {
                path: 'amigos',
                loadComponent: () => import('./features/friends/friend-list/friend-list')
                    .then((m) => m.FriendList)
            },
            {
                path: 'amigos/:accountId',
                loadComponent: () => import('./features/friends/comparison/comparison')
                    .then((m) => m.Comparison)
            },
            {
                path: 'ajustes',
                loadComponent: () => import('./features/settings/settings')
                    .then((m) => m.Settings)
            },
            { path: '', redirectTo: 'inicio', pathMatch: 'full' },
        ],
    }, { path: '**', redirectTo: '' }
];
