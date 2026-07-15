import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, required, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { firstValueFrom } from 'rxjs';
import { City, SellingOptionSchedule, SellingOptionSummary } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface SellingOptionFilterModel {
    toCityId: string;
    date: string;
}

@Component({
    selector: 'app-selling-options',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />

        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <span class="font-semibold text-lg">Selling options preview</span>
            </ng-template>
        </p-toolbar>

        <form (submit)="search($event)" class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
            <div>
                <label class="font-medium block mb-2">Destination city</label>
                <select class="w-full p-inputtext" [field]="filterForm.toCityId">
                    <option value="">Select city</option>
                    @for (city of cities(); track city.id) {
                        <option [value]="city.id">{{ city.name }}</option>
                    }
                </select>
                <app-field-errors [field]="filterForm.toCityId" />
            </div>
            <div>
                <label class="font-medium block mb-2">Travel date</label>
                <input type="date" class="w-full p-inputtext" [field]="filterForm.date" />
                <app-field-errors [field]="filterForm.date" />
            </div>
            <p-button type="submit" label="Search" icon="pi pi-search" [loading]="loading()" />
        </form>

        <p-table [value]="options()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="optionKey">
            <ng-template #header>
                <tr>
                    <th>Route</th>
                    <th>Association</th>
                    <th>Level / Type</th>
                    <th>Price</th>
                    <th>Next departure</th>
                    <th>Buses</th>
                    <th>Seats</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-option>
                <tr>
                    <td>
                        {{ option.fromStation.name }} → {{ option.toStation.name }}
                        <div class="text-muted-color text-sm">{{ option.fromCity }} → {{ option.toCity }}</div>
                    </td>
                    <td>{{ option.association.code }}</td>
                    <td>{{ option.busLevel.code }} / {{ option.busType.name }}</td>
                    <td>{{ option.ticketPrice | number: '1.2-2' }} ETB</td>
                    <td>{{ option.nextDepartureAt | date: 'short' }}</td>
                    <td>{{ option.availableBusCount }}</td>
                    <td>{{ option.availableSeatCount }}</td>
                    <td>
                        <p-button label="Schedules" icon="pi pi-list" size="small" [outlined]="true" (onClick)="openSchedules(option)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog
            [(visible)]="scheduleDialogVisible"
            [header]="selectedOptionLabel()"
            [modal]="true"
            [style]="{ width: '760px' }"
        >
            <p-table [value]="optionSchedules()" [loading]="loadingSchedules()" dataKey="scheduleId">
                <ng-template #header>
                    <tr>
                        <th>Seq</th>
                        <th>Departure</th>
                        <th>Bus</th>
                        <th>Seats</th>
                        <th>Status</th>
                    </tr>
                </ng-template>
                <ng-template #body let-row>
                    <tr>
                        <td>{{ row.sequenceNumber }}</td>
                        <td>{{ row.departureAt | date: 'medium' }}</td>
                        <td>{{ row.plateNumber }} ({{ row.sideNumber }})</td>
                        <td>{{ row.availableSeatCount }}/{{ row.totalSeats }}</td>
                        <td>
                            @if (row.isFullySold) {
                                <p-tag value="Sold out" severity="danger" />
                            } @else {
                                <p-tag value="Open" severity="success" />
                            }
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </p-dialog>
    `
})
export class SellingOptions implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    cities = signal<City[]>([]);
    options = signal<SellingOptionSummary[]>([]);
    optionSchedules = signal<SellingOptionSchedule[]>([]);

    loading = signal(false);
    loadingSchedules = signal(false);
    scheduleDialogVisible = false;
    selectedOption = signal<SellingOptionSummary | null>(null);

    filterModel = signal<SellingOptionFilterModel>(this.defaultFilters());
    filterForm = form(this.filterModel, (path) => {
        required(path.toCityId, { message: 'Destination city is required' });
        required(path.date, { message: 'Date is required' });
    });

    ngOnInit() {
        void this.loadCities();
    }

    selectedOptionLabel() {
        const option = this.selectedOption();
        if (!option) return 'Schedules';
        return `${option.fromCity} → ${option.toCity} — ${option.busLevel.code}/${option.busType.code}`;
    }

    async loadCities() {
        try {
            const cities = await firstValueFrom(this.api.getCities());
            this.cities.set(cities.filter((c) => c.isActive && c.distanceFromAddisKm > 0));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        }
    }

    async search(event: Event) {
        event.preventDefault();
        this.loading.set(true);

        try {
            await submit(this.filterForm, async () => {
                const filters = this.filterModel();
                this.options.set(await firstValueFrom(this.api.searchSellingOptions(filters.toCityId, filters.date)));
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    async openSchedules(option: SellingOptionSummary) {
        this.selectedOption.set(option);
        this.scheduleDialogVisible = true;
        this.loadingSchedules.set(true);

        try {
            this.optionSchedules.set(await firstValueFrom(this.api.getSellingOptionSchedules(option.optionKey)));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
            this.optionSchedules.set([]);
        } finally {
            this.loadingSchedules.set(false);
        }
    }

    private defaultFilters(): SellingOptionFilterModel {
        const today = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        return {
            toCityId: '',
            date: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
        };
    }
}
