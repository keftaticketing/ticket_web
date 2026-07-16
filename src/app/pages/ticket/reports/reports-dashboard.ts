import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Field, form, min, required, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import { DashboardReport } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface ReportFilterModel {
    from: string;
    to: string;
    top: number;
}

@Component({
    selector: 'app-reports-dashboard',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, RouterLink, CardModule, TableModule, ButtonModule, ToastModule, Field, FieldErrors],
    template: `
        <p-toast />

        <p-card header="Report Filters" styleClass="mb-4">
            <form (submit)="loadReport($event)" class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="font-medium block mb-2">From</label>
                    <input type="date" class="w-full p-inputtext" [field]="filterForm.from" />
                    <app-field-errors [field]="filterForm.from" />
                </div>
                <div>
                    <label class="font-medium block mb-2">To</label>
                    <input type="date" class="w-full p-inputtext" [field]="filterForm.to" />
                    <app-field-errors [field]="filterForm.to" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Top N</label>
                    <input type="number" class="w-full p-inputtext" [field]="filterForm.top" />
                    <app-field-errors [field]="filterForm.top" />
                </div>
                <p-button type="submit" label="Run Report" icon="pi pi-chart-bar" [loading]="loading()" />
            </form>
        </p-card>

        @if (report(); as data) {
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <p-card header="Tickets Sold">
                    <div class="text-3xl font-semibold">{{ data.summary.totalTicketsSold }}</div>
                </p-card>
                <p-card header="Ticket Fare">
                    <div class="text-3xl font-semibold">{{ data.summary.totalTicketFareEtb | number: '1.2-2' }} ETB</div>
                </p-card>
                <p-card header="Sales Fees">
                    <div class="text-3xl font-semibold">{{ data.summary.totalSalesFeeEtb | number: '1.2-2' }} ETB</div>
                </p-card>
                <p-card header="Cash Collected">
                    <div class="text-3xl font-semibold">{{ data.summary.totalCashCollectedEtb | number: '1.2-2' }} ETB</div>
                </p-card>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <p-card header="Tickets by Day">
                    <p-table [value]="data.ticketsByDay" [paginator]="true" [rows]="7">
                        <ng-template #header>
                            <tr>
                                <th>Date</th>
                                <th>Tickets</th>
                                <th>Fare</th>
                                <th>Cash</th>
                                <th></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-row>
                            <tr>
                                <td>{{ row.date }}</td>
                                <td>{{ row.ticketCount }}</td>
                                <td>{{ row.ticketFareEtb | number: '1.2-2' }}</td>
                                <td>{{ row.totalCashCollectedEtb | number: '1.2-2' }}</td>
                                <td>
                                    <a [routerLink]="['/ticket/tickets']" [queryParams]="{ date: row.date }" class="text-primary font-medium no-underline hover:underline"> View tickets </a>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>

                <p-card header="Top Buses">
                    <p-table [value]="data.topBuses">
                        <ng-template #header>
                            <tr>
                                <th>Plate</th>
                                <th>Side</th>
                                <th>Sold</th>
                                <th>Fare</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-row>
                            <tr>
                                <td>{{ row.plateNumber }}</td>
                                <td>{{ row.sideNumber }}</td>
                                <td>{{ row.ticketsSold }}</td>
                                <td>{{ row.ticketFareEtb | number: '1.2-2' }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>

                <p-card header="Top Counters">
                    <p-table [value]="data.topCounters">
                        <ng-template #header>
                            <tr>
                                <th>User</th>
                                <th>Sold</th>
                                <th>Cash</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-row>
                            <tr>
                                <td>{{ row.userName }}</td>
                                <td>{{ row.ticketsSold }}</td>
                                <td>{{ row.totalCashCollectedEtb | number: '1.2-2' }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>

                <p-card header="Party Totals">
                    <p-table [value]="data.summary.partyTotals">
                        <ng-template #header>
                            <tr>
                                <th>Party</th>
                                <th>Source</th>
                                <th>Amount</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-row>
                            <tr>
                                <td>{{ row.partyName }}</td>
                                <td>{{ row.source }}</td>
                                <td>{{ row.amountEtb | number: '1.2-2' }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        }
    `
})
export class ReportsDashboard implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    report = signal<DashboardReport | null>(null);
    loading = signal(false);

    filterModel = signal<ReportFilterModel>(this.defaultFilters());
    filterForm = form(this.filterModel, (path) => {
        required(path.from, { message: 'Start date is required' });
        required(path.to, { message: 'End date is required' });
        min(path.top, 1, { message: 'Top must be at least 1' });
    });

    ngOnInit() {
        void this.loadReport();
    }

    async loadReport(event?: Event) {
        event?.preventDefault();
        this.loading.set(true);

        try {
            await submit(this.filterForm, async () => {
                const filters = this.filterModel();
                const report = await firstValueFrom(this.api.getDashboardReport(filters.from, filters.to, filters.top));
                this.report.set(report);
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    private defaultFilters(): ReportFilterModel {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
            from: this.toDateInput(from),
            to: this.toDateInput(today),
            top: 10
        };
    }

    private toDateInput(date: Date) {
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
}
