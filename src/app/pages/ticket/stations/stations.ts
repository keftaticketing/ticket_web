import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, required, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { firstValueFrom } from 'rxjs';
import { City, CreateStationRequest, Station, UpdateStationRequest } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface StationFormModel {
    cityId: string;
    name: string;
    nameAm: string;
    code: string;
    isActive: boolean;
}

@Component({
    selector: 'app-stations',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Station" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <div class="mb-4 max-w-sm">
            <label class="font-medium block mb-2">Filter by City</label>
            <select class="w-full p-inputtext" [value]="selectedCityId()" (change)="onFilterCityChanged($event)">
                <option value="">All cities</option>
                @for (city of cities(); track city.id) {
                    <option [value]="city.id">{{ city.name }}</option>
                }
            </select>
        </div>

        <p-table [value]="stations()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Name (Am)</th>
                    <th>City</th>
                    <th>Default</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-item>
                <tr>
                    <td>{{ item.code }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.nameAm }}</td>
                    <td>{{ item.cityName }}</td>
                    <td><p-tag [value]="item.isImplicitDefault ? 'Default' : 'Custom'" [severity]="item.isImplicitDefault ? 'contrast' : 'secondary'" /></td>
                    <td><p-tag [value]="item.isActive ? 'Active' : 'Inactive'" [severity]="item.isActive ? 'success' : 'danger'" /></td>
                    <td><p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editStation(item)" /></td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Station' : 'New Station'" [modal]="true" [style]="{ width: '520px' }">
            <form (submit)="saveStation($event)" class="flex flex-col gap-3">
                @if (!editingId()) {
                    <div>
                        <label class="font-medium block mb-2">City</label>
                        <select class="w-full p-inputtext" [field]="stationForm.cityId">
                            <option value="">Select city</option>
                            @for (city of cities(); track city.id) {
                                <option [value]="city.id">{{ city.name }}</option>
                            }
                        </select>
                        <app-field-errors [field]="stationForm.cityId" />
                    </div>
                    <div>
                        <label class="font-medium block mb-2">Code</label>
                        <input pInputText class="w-full" [field]="stationForm.code" />
                        <app-field-errors [field]="stationForm.code" />
                    </div>
                }
                <div>
                    <label class="font-medium block mb-2">Name</label>
                    <input pInputText class="w-full" [field]="stationForm.name" />
                    <app-field-errors [field]="stationForm.name" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Name (Amharic)</label>
                    <input pInputText class="w-full" [field]="stationForm.nameAm" />
                    <app-field-errors [field]="stationForm.nameAm" />
                </div>
                @if (editingId()) {
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="stationActive" [field]="stationForm.isActive" />
                        <label for="stationActive">Active</label>
                    </div>
                }
                <div class="flex justify-end gap-2 mt-2">
                    <p-button type="button" label="Cancel" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button type="submit" label="Save" [loading]="saving()" />
                </div>
            </form>
        </p-dialog>
    `
})
export class Stations implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    stations = signal<Station[]>([]);
    cities = signal<City[]>([]);
    selectedCityId = signal('');
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    stationModel = signal<StationFormModel>(this.emptyForm());
    stationForm = form(this.stationModel, (path) => {
        required(path.cityId, { message: 'City is required' });
        required(path.code, { message: 'Code is required' });
        required(path.name, { message: 'Name is required' });
        required(path.nameAm, { message: 'Amharic name is required' });
    });

    ngOnInit() {
        void this.loadData();
    }

    async loadData() {
        this.loading.set(true);
        try {
            const cityId = this.selectedCityId() || undefined;
            const [stations, cities] = await Promise.all([firstValueFrom(this.api.getStations(cityId)), firstValueFrom(this.api.getCities())]);
            this.stations.set(stations);
            this.cities.set(cities);
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    onFilterCityChanged(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedCityId.set(value);
        void this.loadData();
    }

    openNew() {
        this.editingId.set(null);
        this.stationModel.set({ ...this.emptyForm(), cityId: this.selectedCityId() || '' });
        this.dialogVisible = true;
    }

    editStation(item: Station) {
        this.editingId.set(item.id);
        this.stationModel.set({ cityId: item.cityId, code: item.code, name: item.name, nameAm: item.nameAm, isActive: item.isActive });
        this.dialogVisible = true;
    }

    async saveStation(event: Event) {
        event.preventDefault();
        this.saving.set(true);
        try {
            await submit(this.stationForm, async () => {
                const model = this.stationModel();
                const id = this.editingId();
                if (id) {
                    const request: UpdateStationRequest = { name: model.name, nameAm: model.nameAm, isActive: model.isActive };
                    await firstValueFrom(this.api.updateStation(id, request));
                } else {
                    const request: CreateStationRequest = { cityId: model.cityId, code: model.code.trim(), name: model.name, nameAm: model.nameAm };
                    await firstValueFrom(this.api.createStation(request));
                }
                this.dialogVisible = false;
                await this.loadData();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Station saved successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private emptyForm(): StationFormModel {
        return { cityId: '', code: '', name: '', nameAm: '', isActive: true };
    }
}
