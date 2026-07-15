import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiErrorResponse } from '@/app/core/models/api.models';
import { AuthService } from '@/app/core/services/auth.service';
import { environment } from '@/environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!req.url.startsWith(environment.apiUrl)) {
        return next(req);
    }

    const token = auth.getToken();
    const headers: Record<string, string> = {
        'X-Client-Id': environment.clientId,
        'X-Client-Key': environment.clientKey
    };

    if (token && !req.url.includes('/auth/login')) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const apiReq = req.clone({ setHeaders: headers });

    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 403) {
                const body = error.error as ApiErrorResponse | null;
                if (body?.code === 'Auth.PasswordChangeRequired') {
                    auth.markPasswordChangeRequired();
                    void router.navigate(['/auth/change-password']);
                }
            }

            return throwError(() => error);
        })
    );
};
