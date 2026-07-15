import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';

export const adminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isAuthenticated() && auth.isAdmin()) {
        return true;
    }

    if (auth.isAuthenticated()) {
        return router.createUrlTree(['/auth/access']);
    }

    return router.createUrlTree(['/auth/login']);
};
