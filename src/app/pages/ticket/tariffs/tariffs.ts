import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, min, required, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { firstValueFrom } from 'rxjs';
import { SetTariffRequest, Tariff } from '@/app/core/models/api.models';
import { ReferenceDataService } from '@/app/core/services/reference-data.service';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface TariffFormModel {
    busLevelId: string;
    busTypeId: string;
    ratePerKm: number;
}

@Component({
    selector: 'app-tariffs',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, CardModule, TableModule, DialogModule, ButtonModule, InputTextModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="Set Tariff Rule" icon="pi pi-plus" (onClick)="openDialog()" />
            </ng-template>
        </p-toolbar>

        <p-card header="Active Tariff Rules" styleClass="mb-4">
            <p-table [value]="activeTariffs()" [loading]="loading()" [paginator]="true" [rows]="10">
                <ng-template #header>
                    <tr>
                        <th>Level</th>
                        <th>Type</th>
                        <th>Rate/km</th>
                        <th>Effective From</th>
                    </tr>
                </ng-template>
                <ng-template #body let-item>
                    <tr>
                        <td>{{ item.busLevel.code }} — {{ item.busLevel.name }}</td>
                        <td>{{ item.busType.name }}</td>
                        <td>{{ item.ratePerKm | number: '1.2-2' }} {{ item.currency }}</td>
                        <td>{{ item.effectiveFrom | date: 'medium' }}</td>
                    </tr>
                </ng-template>
            </p-table>
        </p-card>

        <p-card header="Tariff History">
            <p-table [value]="history()" [loading]="loading()" [paginator]="true" [rows]="10">
                <ng-template #header>
                    <tr>
                        <th>Level</th>
                        <th>Type</th>
                        <th>Rate/km</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Status</th>
                    </tr>
                </ng-template>
                <ng-template #body let-item>
                    <tr>
                        <td>{{ item.busLevel.code }}</td>
                        <td>{{ item.busType.code }}</td>
                        <td>{{ item.ratePerKm | number: '1.2-2' }} {{ item.currency }}</td>
                        <td>{{ item.effectiveFrom | date: 'medium' }}</td>
                        <td>{{ item.effectiveTo ? (item.effectiveTo | date: 'medium') : '—' }}</td>
                        <td>
                            <p-tag [value]="item.isActive ? 'Active' : 'Inactive'" [severity]="item.isActive ? 'success' : 'secondary'" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </p-card>

        <p-dialog [(visible)]="dialogVisible" header="Set Tariff Rule" [modal]="true" [style]="{ width: '480px' }">
            <p class="text-muted-color mt-0 mb-4">Each bus level + type combination has its own per-km rate. New schedules snapshot the active rule at create time.</p>
            <form (submit)="saveTariff($event)" class="flex flex-col gap-3">
                <div>
                    <label class="font-medium block mb-2">Bus Level</label>
                    <select class="w-full p-inputtext" [field]="tariffForm.busLevelId">
                        <option value="">Select level</option>
                        @for (level of reference.busLevels(); track level.id) {
                            <option [value]="level.id">{{ level.code }} — {{ level.name }}</option>
                        }
                    </select>
                    <app-field-errors [field]="tariffForm.busLevelId" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Bus Type</label>
                    <select class="w-full p-inputtext" [field]="tariffForm.busTypeId">
                        <option value="">Select type</option>
                        @for (type of reference.busTypes(); track type.id) {
                            <option [value]="type.id">{{ type.name }}</option>
                        }
                    </select>
                    <app-field-errors [field]="tariffForm.busTypeId" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Rate per km (ETB)</label>
                    <input type="number" step="0.01" pInputText class="w-full" [field]="tariffForm.ratePerKm" />
                    <app-field-errors [field]="tariffForm.ratePerKm" />
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <p-button type="button" label="Cancel" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button type="submit" label="Save" [loading]="saving()" />
                </div>
            </form>
        </p-dialog>
    `
})
export class Tariffs implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);
    readonly reference = inject(ReferenceDataService);

    activeTariffs = signal<Tariff[]>([]);
    history = signal<Tariff[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;

    tariffModel = signal<TariffFormModel>({ busLevelId: '', busTypeId: '', ratePerKm: 0 });
    tariffForm = form(this.tariffModel, (path) => {
        required(path.busLevelId, { message: 'Bus level is required' });
        required(path.busTypeId, { message: 'Bus type is required' });
        min(path.ratePerKm, 0.01, { message: 'Rate must be greater than zero' });
        required(path.ratePerKm, { message: 'Rate is required' });
    });

    ngOnInit() {
        void this.loadData();
    }

    async loadData() {
        this.loading.set(true);
        try {
            await this.reference.ensureLoaded();
            const [active, history] = await Promise.all([
                firstValueFrom(this.api.getActiveTariffs()),
                firstValueFrom(this.api.getTariffHistory())
            ]);
            this.activeTariffs.set(active);
            this.history.set(history);
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openDialog() {
        const firstActive = this.activeTariffs()[0];
        this.tariffModel.set({
            busLevelId: firstActive?.busLevel.id ?? this.reference.busLevels()[0]?.id ?? '',
            busTypeId: firstActive?.busType.id ?? this.reference.busTypes()[0]?.id ?? '',
            ratePerKm: firstActive?.ratePerKm ?? 0
        });
        this.dialogVisible = true;
    }

    async saveTariff(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.tariffForm, async () => {
                const request: SetTariffRequest = this.tariffModel();
                await firstValueFrom(this.api.setTariff(request));
                this.dialogVisible = false;
                this.reference.reset();
                await this.loadData();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Tariff rule updated successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }
}
