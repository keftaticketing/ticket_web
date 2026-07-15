import { Component, inject, OnInit, signal } from '@angular/core';
import { Field, form, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import { PaymentSettings, UpdatePaymentSettingsRequest } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface PaymentSettingsFormModel {
    onlinePaymentEnabled: boolean;
}

@Component({
    selector: 'app-payment-settings',
    standalone: true,
    providers: [MessageService],
    imports: [CardModule, ButtonModule, ToastModule, Field],
    template: `
        <p-toast />
        <p-card header="Payment Settings" [style]="{ maxWidth: '480px' }">
            <form (submit)="saveSettings($event)" class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="onlinePaymentEnabled" [field]="settingsForm.onlinePaymentEnabled" />
                    <label for="onlinePaymentEnabled">Enable online (Chapa) payments</label>
                </div>
                <p-button type="submit" label="Save Settings" icon="pi pi-save" [loading]="saving()" />
            </form>
        </p-card>
    `
})
export class PaymentSettingsPage implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    saving = signal(false);

    settingsModel = signal<PaymentSettingsFormModel>({ onlinePaymentEnabled: false });
    settingsForm = form(this.settingsModel);

    ngOnInit() {
        void this.loadSettings();
    }

    async loadSettings() {
        try {
            const settings = await firstValueFrom(this.api.getPaymentSettings());
            this.settingsModel.set({ onlinePaymentEnabled: settings.onlinePaymentEnabled });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        }
    }

    async saveSettings(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.settingsForm, async () => {
                const request: UpdatePaymentSettingsRequest = this.settingsModel();
                await firstValueFrom(this.api.updatePaymentSettings(request));
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Payment settings updated' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }
}
