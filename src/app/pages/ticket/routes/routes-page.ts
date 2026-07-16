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
import { CheckboxModule } from 'primeng/checkbox';
import { firstValueFrom } from 'rxjs';
import { City, CreateRouteRequest, Route, RouteStation, UpdateRouteRequest } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface RouteFormModel {
    toCityId: string;
    toStationId: string;
    isActive: boolean;
}

@Component({
    selector: 'app-routes-page',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, TagModule, ToastModule, ToolbarModule, CheckboxModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Route" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="routes()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>From Station</th>
                    <th>To Station</th>
                    <th>Cities</th>
                    <th>Distance (km)</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-route>
                <tr>
                    <td>{{ route.fromStation.name }} ({{ route.fromStation.code }})</td>
                    <td>{{ route.toStation.name }} ({{ route.toStation.code }})</td>
                    <td>{{ route.fromCity }} → {{ route.toCity }}</td>
                    <td>{{ route.distanceKm }}</td>
                    <td>
                        <p-tag [value]="route.isActive ? 'Active' : 'Inactive'" [severity]="route.isActive ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editRoute(route)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Route' : 'New Route'" [modal]="true" [style]="{ width: '480px' }">
            <form (submit)="saveRoute($event)" class="flex flex-col gap-3">
                <div>
                    <label class="font-medium block mb-2">Destination City</label>
                    <select class="w-full p-inputtext" [field]="routeForm.toCityId" (change)="onCityChanged()">
                        <option value="">Select destination</option>
                        @for (city of destinationCities(); track city.id) {
                            <option [value]="city.id">{{ city.name }} ({{ city.distanceFromAddisKm }} km)</option>
                        }
                    </select>
                    <app-field-errors [field]="routeForm.toCityId" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Destination Station (optional)</label>
                    <select class="w-full p-inputtext" [field]="routeForm.toStationId">
                        <option value="">Use city default station</option>
                        @for (station of stationsForSelectedCity(); track station.id) {
                            <option [value]="station.id">{{ station.name }} — {{ station.code }}</option>
                        }
                    </select>
                </div>
                @if (editingId()) {
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="routeActive" [field]="routeForm.isActive" />
                        <label for="routeActive">Active</label>
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
export class RoutesPage implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    routes = signal<Route[]>([]);
    destinationCities = signal<City[]>([]);
    stationOptions = signal<RouteStation[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    routeModel = signal<RouteFormModel>({ toCityId: '', toStationId: '', isActive: true });
    routeForm = form(this.routeModel, (path) => {
        required(path.toCityId, { message: 'Destination city is required' });
    });

    ngOnInit() {
        void this.loadData();
    }

    stationsForSelectedCity() {
        const cityId = this.routeModel().toCityId;
        return this.stationOptions().filter((s) => s.cityId === cityId);
    }

    onCityChanged() {
        this.routeModel.update((m) => ({ ...m, toStationId: '' }));
    }

    async loadData() {
        this.loading.set(true);
        try {
            const [routes, cities] = await Promise.all([firstValueFrom(this.api.getRoutes()), firstValueFrom(this.api.getCities())]);
            this.routes.set(routes);
            this.destinationCities.set(cities.filter((c) => c.distanceFromAddisKm > 0));
            this.stationOptions.set(this.collectStations(routes));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.editingId.set(null);
        this.routeModel.set({ toCityId: '', toStationId: '', isActive: true });
        this.dialogVisible = true;
    }

    editRoute(route: Route) {
        this.editingId.set(route.id);
        this.routeModel.set({
            toCityId: route.toCityId,
            toStationId: route.toStation.id,
            isActive: route.isActive
        });
        this.dialogVisible = true;
    }

    async saveRoute(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.routeForm, async () => {
                const model = this.routeModel();
                const id = this.editingId();
                const station = model.toStationId || null;

                if (id) {
                    const request: UpdateRouteRequest = {
                        toCityId: model.toCityId,
                        isActive: model.isActive,
                        toStationId: station
                    };
                    await firstValueFrom(this.api.updateRoute(id, request));
                } else {
                    const request: CreateRouteRequest = {
                        toCityId: model.toCityId,
                        toStationId: station
                    };
                    await firstValueFrom(this.api.createRoute(request));
                }

                this.dialogVisible = false;
                await this.loadData();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Route saved successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private collectStations(routes: Route[]): RouteStation[] {
        const map = new Map<string, RouteStation>();
        for (const route of routes) {
            map.set(route.fromStation.id, route.fromStation);
            map.set(route.toStation.id, route.toStation);
        }
        return [...map.values()];
    }
}
