import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Field, form, required, submit, validateTree } from '@angular/forms/signals';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/core/services/auth.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { passwordPolicy } from '@/app/shared/validators/password.validators';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface ChangePasswordFormModel {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [ButtonModule, PasswordModule, MessageModule, Field, FieldErrors, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-16 px-8 sm:px-20" style="border-radius: 53px; min-width: 28rem">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Change Your Password</div>
                            <span class="text-muted-color font-medium"> For security, you must set a new password before using the admin portal. </span>
                        </div>

                        @if (serverError()) {
                            <p-message severity="error" [text]="serverError()!" styleClass="mb-4 w-full" />
                        }

                        <form (submit)="onSubmit($event)">
                            <label for="currentPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2"> Current Password </label>
                            <p-password id="currentPassword" placeholder="Current password" [toggleMask]="true" styleClass="mb-2 w-full" [fluid]="true" [feedback]="false" [field]="changePasswordForm.currentPassword" />
                            <app-field-errors [field]="changePasswordForm.currentPassword" />

                            <label for="newPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2 mt-4"> New Password </label>
                            <p-password id="newPassword" placeholder="New password" [toggleMask]="true" styleClass="mb-2 w-full" [fluid]="true" [feedback]="true" [field]="changePasswordForm.newPassword" />
                            <app-field-errors [field]="changePasswordForm.newPassword" />
                            <p class="text-muted-color text-sm mt-1 mb-0">At least 8 characters with uppercase, lowercase, digit, and special character.</p>

                            <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2 mt-4"> Confirm New Password </label>
                            <p-password id="confirmPassword" placeholder="Confirm new password" [toggleMask]="true" styleClass="mb-2 w-full" [fluid]="true" [feedback]="false" [field]="changePasswordForm.confirmPassword" />
                            <app-field-errors [field]="changePasswordForm.confirmPassword" />

                            <p-button type="submit" label="Update Password" styleClass="w-full mt-6" [loading]="submitting()" />
                            <p-button type="button" label="Sign out" severity="secondary" styleClass="w-full mt-3" [text]="true" (onClick)="auth.logout()" />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ChangePassword {
    readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    submitting = signal(false);
    serverError = signal<string | null>(null);

    changePasswordModel = signal<ChangePasswordFormModel>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    changePasswordForm = form(this.changePasswordModel, (path) => {
        required(path.currentPassword, { message: 'Current password is required' });
        required(path.newPassword, { message: 'New password is required' });
        passwordPolicy(path.newPassword);
        required(path.confirmPassword, { message: 'Please confirm your new password' });
        validateTree(path, (ctx) => {
            const newPassword = ctx.fieldTree.newPassword().value();
            const confirmPassword = ctx.fieldTree.confirmPassword().value();

            if (!confirmPassword || newPassword === confirmPassword) {
                return null;
            }

            return {
                kind: 'mismatch',
                message: 'Passwords do not match',
                field: ctx.fieldTree.confirmPassword
            };
        });
    });

    async onSubmit(event: Event) {
        event.preventDefault();
        this.serverError.set(null);
        this.submitting.set(true);

        try {
            await submit(this.changePasswordForm, async () => {
                const model = this.changePasswordModel();
                await this.auth.changePasswordAsync({
                    currentPassword: model.currentPassword,
                    newPassword: model.newPassword
                });
                await this.router.navigateByUrl('/');
            });
        } catch (error) {
            this.serverError.set(getApiErrorMessage(error, 'Could not change password'));
        } finally {
            this.submitting.set(false);
        }
    }
}
