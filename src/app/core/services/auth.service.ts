import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, tap } from 'rxjs';
import { environment } from '@/environments/environment';
import { AuthTokenResponse, ChangePasswordRequest, LoginRequest, LoginResponse, LogoutRequest } from '@/app/core/models/api.models';

const TOKEN_KEY = 'ticket_access_token';
const REFRESH_TOKEN_KEY = 'ticket_refresh_token';
const USER_KEY = 'ticket_user';

export interface AuthUser {
    fullName: string;
    role: string;
    mustChangePassword: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

    readonly user = this.userSignal.asReadonly();
    readonly isAuthenticated = computed(() => !!this.getToken());
    readonly isAdmin = computed(() => this.userSignal()?.role === 'Admin');
    readonly mustChangePassword = computed(() => this.userSignal()?.mustChangePassword === true);

    login(request: LoginRequest) {
        return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(tap((response) => this.applySession(response)));
    }

    async loginAsync(request: LoginRequest) {
        return firstValueFrom(this.login(request));
    }

    changePassword(request: ChangePasswordRequest) {
        return this.http.post<AuthTokenResponse>(`${environment.apiUrl}/auth/change-password`, request).pipe(tap((response) => this.applySession(response)));
    }

    async changePasswordAsync(request: ChangePasswordRequest) {
        return firstValueFrom(this.changePassword(request));
    }

    markPasswordChangeRequired() {
        const user = this.userSignal();
        if (!user) {
            return;
        }

        const updated = { ...user, mustChangePassword: true };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        this.userSignal.set(updated);
    }

    logout() {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
            const request: LogoutRequest = { refreshToken };
            void firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, request)).catch(() => undefined);
        }

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this.userSignal.set(null);
        void this.router.navigate(['/auth/login']);
    }

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    private applySession(response: LoginResponse | AuthTokenResponse) {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);

        const user: AuthUser = {
            fullName: response.fullName,
            role: response.role,
            mustChangePassword: response.mustChangePassword
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSignal.set(user);
    }

    private readStoredUser(): AuthUser | null {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as AuthUser;
        } catch {
            return null;
        }
    }
}
