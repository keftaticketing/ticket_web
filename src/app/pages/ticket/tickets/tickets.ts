import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Field, form, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { firstValueFrom } from 'rxjs';
import { Schedule, Ticket } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface TicketFilterModel {
    scheduleId: string;
    passengerPhone: string;
    date: string;
}

@Component({
    selector: 'app-tickets',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule, ToastModule, ToolbarModule, InputTextModule, Field],
    template: `
        <p-toast />

        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <span class="font-semibold text-lg">Ticket search</span>
            </ng-template>
            <ng-template #end>
                <a routerLink="/" class="text-primary font-medium no-underline hover:underline">Back to reports</a>
            </ng-template>
        </p-toolbar>

        <form (submit)="search($event)" class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-4">
            <div>
                <label class="font-medium block mb-2">Schedule</label>
                <select class="w-full p-inputtext" [field]="filterForm.scheduleId">
                    <option value="">Any schedule</option>
                    @for (schedule of schedules(); track schedule.id) {
                        <option [value]="schedule.id">{{ schedule.fromCity }} → {{ schedule.toCity }} — {{ schedule.departureAt | date: 'short' }} (#{{ schedule.sequenceNumber }})</option>
                    }
                </select>
            </div>
            <div>
                <label class="font-medium block mb-2">Passenger phone</label>
                <input pInputText class="w-full" placeholder="09XXXXXXXX" [field]="filterForm.passengerPhone" />
            </div>
            <div>
                <label class="font-medium block mb-2">Sold date</label>
                <input type="date" class="w-full p-inputtext" [field]="filterForm.date" />
            </div>
            <p-button type="submit" label="Search" icon="pi pi-search" [loading]="loading()" />
            <p-button type="button" label="Clear" severity="secondary" (onClick)="clearFilters()" />
        </form>

        <p-table [value]="tickets()" [loading]="loading()" [paginator]="true" [rows]="15" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Passenger</th>
                    <th>Phone</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Seat</th>
                    <th>Bus</th>
                    <th>Price</th>
                    <th>Payment</th>
                    <th>Sold by</th>
                    <th>Sold at</th>
                </tr>
            </ng-template>
            <ng-template #body let-ticket>
                <tr>
                    <td>{{ ticket.passengerName }}</td>
                    <td>{{ ticket.passengerPhone }}</td>
                    <td>{{ ticket.fromCity }} → {{ ticket.toCity }}</td>
                    <td>{{ ticket.departureAt | date: 'medium' }} (#{{ ticket.sequenceNumber }})</td>
                    <td>{{ ticket.seatNumber }}</td>
                    <td>{{ ticket.plateNumber }}</td>
                    <td>{{ ticket.price | number: '1.2-2' }} ETB</td>
                    <td><p-tag [value]="ticket.paymentMethod" /></td>
                    <td>{{ ticket.soldBy }}</td>
                    <td>{{ ticket.soldAt | date: 'medium' }}</td>
                </tr>
            </ng-template>
        </p-table>
    `
})
export class Tickets implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);
    private readonly route = inject(ActivatedRoute);

    tickets = signal<Ticket[]>([]);
    schedules = signal<Schedule[]>([]);
    loading = signal(false);

    filterModel = signal<TicketFilterModel>(this.emptyFilters());
    filterForm = form(this.filterModel);

    ngOnInit() {
        void this.initialize();
    }

    private async initialize() {
        await this.loadSchedules();

        const params = this.route.snapshot.queryParamMap;
        const date = params.get('date') ?? '';
        const passengerPhone = params.get('passengerPhone') ?? '';
        const scheduleId = params.get('scheduleId') ?? '';

        if (date || passengerPhone || scheduleId) {
            this.filterModel.set({ scheduleId, passengerPhone, date });
            await this.runSearch();
        }
    }

    async loadSchedules() {
        try {
            this.schedules.set(await firstValueFrom(this.api.getSchedules()));
        } catch {
            this.schedules.set([]);
        }
    }

    async search(event: Event) {
        event.preventDefault();
        await this.runSearch();
    }

    private async runSearch() {
        this.loading.set(true);

        try {
            await submit(this.filterForm, async () => {
                const filters = this.filterModel();
                this.tickets.set(await firstValueFrom(this.api.searchTickets(filters.scheduleId || undefined, filters.passengerPhone || undefined, filters.date || undefined)));
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    clearFilters() {
        this.filterModel.set(this.emptyFilters());
        this.tickets.set([]);
    }

    private emptyFilters(): TicketFilterModel {
        return { scheduleId: '', passengerPhone: '', date: '' };
    }
}
