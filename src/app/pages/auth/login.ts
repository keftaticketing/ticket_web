import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Field, form, minLength, required, submit } from '@angular/forms/signals';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/core/services/auth.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';
import { LoginRequest } from '@/app/core/models/api.models';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, MessageModule, Field, FieldErrors, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px; min-width: 28rem">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Ticket System Admin</div>
                            <span class="text-muted-color font-medium">Sign in with your admin credentials</span>
                        </div>

                        @if (serverError()) {
                            <p-message severity="error" [text]="serverError()!" styleClass="mb-4 w-full" />
                        }

                        <form (submit)="onSubmit($event)">
                            <label for="username" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Username</label>
                            <input pInputText id="username" type="text" placeholder="admin" class="w-full mb-2" [field]="loginForm.username" />
                            <app-field-errors [field]="loginForm.username" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2 mt-4">Password</label>
                            <p-password id="password" placeholder="Password" [toggleMask]="true" styleClass="mb-2 w-full" [fluid]="true" [feedback]="false" [field]="loginForm.password" />
                            <app-field-errors [field]="loginForm.password" />

                            <p-button type="submit" label="Sign In" styleClass="w-full mt-6" [loading]="submitting()" />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    submitting = signal(false);
    serverError = signal<string | null>(null);

    loginModel = signal<LoginRequest>({
        username: '',
        password: ''
    });

    loginForm = form(this.loginModel, (path) => {
        required(path.username, { message: 'Username is required' });
        minLength(path.username, 3, { message: 'Username must be at least 3 characters' });
        required(path.password, { message: 'Password is required' });
        minLength(path.password, 6, { message: 'Password must be at least 6 characters' });
    });

    async onSubmit(event: Event) {
        event.preventDefault();
        this.serverError.set(null);
        this.submitting.set(true);

        try {
            await submit(this.loginForm, async () => {
                const response = await this.auth.loginAsync(this.loginModel());
                if (response.mustChangePassword) {
                    await this.router.navigateByUrl('/auth/change-password');
                } else {
                    await this.router.navigateByUrl('/');
                }
            });
        } catch (error) {
            this.serverError.set(getApiErrorMessage(error, 'Invalid username or password'));
        } finally {
            this.submitting.set(false);
        }
    }
}
