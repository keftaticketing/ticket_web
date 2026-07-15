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
import {
    Bus,
    CreateScheduleRequest,
    Route,
    SCHEDULE_STATUSES,
    Schedule,
    UpdateScheduleRequest
} from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface ScheduleFormModel {
    routeId: string;
    busId: string;
    departureAt: string;
    sequenceNumber: number;
    status: string;
}

interface ScheduleFilterModel {
    routeId: string;
    date: string;
}

@Component({
    selector: 'app-schedules',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Schedule" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <form (submit)="applyFilters($event)" class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4">
            <div>
                <label class="font-medium block mb-2">Route</label>
                <select class="w-full p-inputtext" [field]="filterForm.routeId">
                    <option value="">All routes</option>
                    @for (route of routes(); track route.id) {
                        <option [value]="route.id">{{ route.fromCity }} → {{ route.toCity }}</option>
                    }
                </select>
            </div>
            <div>
                <label class="font-medium block mb-2">Date</label>
                <input type="date" class="w-full p-inputtext" [field]="filterForm.date" />
            </div>
            <p-button type="submit" label="Filter" icon="pi pi-filter" />
        </form>

        <p-table [value]="schedules()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Route</th>
                    <th>Bus</th>
                    <th>Departure</th>
                    <th>Seq</th>
                    <th>Status</th>
                    <th>Available</th>
                    <th>Snapshot Price</th>
                    <th>Rate/km</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-item>
                <tr>
                    <td>{{ item.fromCity }} → {{ item.toCity }}</td>
                    <td>{{ item.plateNumber }}</td>
                    <td>{{ item.departureAt | date: 'medium' }}</td>
                    <td>{{ item.sequenceNumber }}</td>
                    <td><p-tag [value]="item.status" /></td>
                    <td>{{ item.availableSeatCount }}/{{ item.seatCount }}</td>
                    <td>{{ item.ticketPrice | number: '1.2-2' }} ETB</td>
                    <td>{{ item.ratePerKm | number: '1.2-2' }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editSchedule(item)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Schedule' : 'New Schedule'" [modal]="true" [style]="{ width: '560px' }">
            <form (submit)="saveSchedule($event)" class="flex flex-col gap-3">
                @if (!editingId()) {
                    <div>
                        <label class="font-medium block mb-2">Route</label>
                        <select class="w-full p-inputtext" [field]="scheduleForm.routeId">
                            <option value="">Select route</option>
                            @for (route of routes(); track route.id) {
                                <option [value]="route.id">{{ route.fromCity }} → {{ route.toCity }}</option>
                            }
                        </select>
                        <app-field-errors [field]="scheduleForm.routeId" />
                    </div>
                    <div>
                        <label class="font-medium block mb-2">Bus</label>
                        <select class="w-full p-inputtext" [field]="scheduleForm.busId">
                            <option value="">Select bus</option>
                            @for (bus of buses(); track bus.id) {
                                <option [value]="bus.id">
                                    {{ bus.plateNumber }} — {{ bus.busLevel.code }}/{{ bus.busType.code }} ({{ bus.seatCount }} seats)
                                </option>
                            }
                        </select>
                        <app-field-errors [field]="scheduleForm.busId" />
                        <p class="text-muted-color text-sm mt-1 mb-0">Sequence numbers are unique per route/day/level/type option.</p>
                    </div>
                }
                <div>
                    <label class="font-medium block mb-2">Departure</label>
                    <input type="datetime-local" class="w-full p-inputtext" [field]="scheduleForm.departureAt" />
                    <app-field-errors [field]="scheduleForm.departureAt" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Sequence Number</label>
                    <input type="number" class="w-full p-inputtext" [field]="scheduleForm.sequenceNumber" />
                    <app-field-errors [field]="scheduleForm.sequenceNumber" />
                </div>
                @if (editingId()) {
                    <div>
                        <label class="font-medium block mb-2">Status</label>
                        <select class="w-full p-inputtext" [field]="scheduleForm.status">
                            @for (status of statuses; track status) {
                                <option [value]="status">{{ status }}</option>
                            }
                        </select>
                        <app-field-errors [field]="scheduleForm.status" />
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
export class Schedules implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    readonly statuses = SCHEDULE_STATUSES;

    schedules = signal<Schedule[]>([]);
    routes = signal<Route[]>([]);
    buses = signal<Bus[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    filterModel = signal<ScheduleFilterModel>({ routeId: '', date: '' });
    filterForm = form(this.filterModel);

    scheduleModel = signal<ScheduleFormModel>(this.emptyForm());
    scheduleForm = form(this.scheduleModel, (path) => {
        required(path.routeId, { message: 'Route is required' });
        required(path.busId, { message: 'Bus is required' });
        required(path.departureAt, { message: 'Departure time is required' });
        min(path.sequenceNumber, 1, { message: 'Sequence must be at least 1' });
        required(path.status, { message: 'Status is required' });
    });

    ngOnInit() {
        void this.loadData();
    }

    async loadData() {
        this.loading.set(true);
        try {
            const filters = this.filterModel();
            const [schedules, routes, buses] = await Promise.all([
                firstValueFrom(this.api.getSchedules(filters.routeId || undefined, filters.date || undefined)),
                firstValueFrom(this.api.getRoutes()),
                firstValueFrom(this.api.getBuses())
            ]);
            this.schedules.set(schedules);
            this.routes.set(routes.filter((r) => r.isActive));
            this.buses.set(buses.filter((b) => b.isActive));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    async applyFilters(event: Event) {
        event.preventDefault();
        await this.loadData();
    }

    openNew() {
        this.editingId.set(null);
        this.scheduleModel.set(this.emptyForm());
        this.dialogVisible = true;
    }

    editSchedule(item: Schedule) {
        this.editingId.set(item.id);
        this.scheduleModel.set({
            routeId: item.routeId,
            busId: item.busId,
            departureAt: this.toLocalDateTime(item.departureAt),
            sequenceNumber: item.sequenceNumber,
            status: item.status
        });
        this.dialogVisible = true;
    }

    async saveSchedule(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.scheduleForm, async () => {
                const model = this.scheduleModel();
                const id = this.editingId();
                const departureAt = new Date(model.departureAt).toISOString();

                if (id) {
                    const request: UpdateScheduleRequest = {
                        departureAt,
                        sequenceNumber: model.sequenceNumber,
                        status: model.status
                    };
                    await firstValueFrom(this.api.updateSchedule(id, request));
                } else {
                    const request: CreateScheduleRequest = {
                        routeId: model.routeId,
                        busId: model.busId,
                        departureAt,
                        sequenceNumber: model.sequenceNumber
                    };
                    await firstValueFrom(this.api.createSchedule(request));
                }

                this.dialogVisible = false;
                await this.loadData();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Schedule saved with snapshotted pricing' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private emptyForm(): ScheduleFormModel {
        return {
            routeId: '',
            busId: '',
            departureAt: '',
            sequenceNumber: 1,
            status: 'Scheduled'
        };
    }

    private toLocalDateTime(iso: string) {
        const date = new Date(iso);
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
}
