import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, min, required, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { firstValueFrom } from 'rxjs';
import { City, CreateCityRequest } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface CityFormModel {
    name: string;
    distanceFromAddisKm: number;
}

@Component({
    selector: 'app-cities',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New City" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="cities()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Name</th>
                    <th>Distance from Addis (km)</th>
                    <th>Status</th>
                </tr>
            </ng-template>
            <ng-template #body let-city>
                <tr>
                    <td>{{ city.name }}</td>
                    <td>{{ city.distanceFromAddisKm }}</td>
                    <td>
                        <p-tag [value]="city.isActive ? 'Active' : 'Inactive'" [severity]="city.isActive ? 'success' : 'danger'" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" header="New Destination City" [modal]="true" [style]="{ width: '420px' }">
            <form (submit)="saveCity($event)" class="flex flex-col gap-3">
                <div>
                    <label class="font-medium block mb-2">City Name</label>
                    <input pInputText class="w-full" [field]="cityForm.name" />
                    <app-field-errors [field]="cityForm.name" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Distance from Addis Ababa (km)</label>
                    <input type="number" pInputText class="w-full" [field]="cityForm.distanceFromAddisKm" />
                    <app-field-errors [field]="cityForm.distanceFromAddisKm" />
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <p-button type="button" label="Cancel" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button type="submit" label="Save" [loading]="saving()" />
                </div>
            </form>
        </p-dialog>
    `
})
export class Cities implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    cities = signal<City[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;

    cityModel = signal<CityFormModel>({ name: '', distanceFromAddisKm: 0 });
    cityForm = form(this.cityModel, (path) => {
        required(path.name, { message: 'City name is required' });
        min(path.distanceFromAddisKm, 1, { message: 'Distance must be greater than zero' });
    });

    ngOnInit() {
        void this.loadCities();
    }

    async loadCities() {
        this.loading.set(true);
        try {
            this.cities.set(await firstValueFrom(this.api.getCities()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.cityModel.set({ name: '', distanceFromAddisKm: 0 });
        this.dialogVisible = true;
    }

    async saveCity(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.cityForm, async () => {
                const request: CreateCityRequest = this.cityModel();
                await firstValueFrom(this.api.createCity(request));
                this.dialogVisible = false;
                await this.loadCities();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'City created successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }
}
