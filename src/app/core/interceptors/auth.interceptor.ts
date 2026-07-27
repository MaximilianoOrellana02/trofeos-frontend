import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { catchError, throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const token = auth.token;

    const isAuthRoute =
        req.url.includes('/auth/login') || req.url.includes('/auth/register');

    const request =
        token && !isAuthRoute
            ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            : req;

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            // Token vencido o inválido: cerramos sesión
            if (error.status === 401 && !isAuthRoute) {
                auth.logout();
            }
            return throwError(() => error);
        })
    );
}