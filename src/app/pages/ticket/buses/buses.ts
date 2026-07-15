import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, min, minLength, pattern, required, submit } from '@angular/forms/signals';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CheckboxModule } from 'primeng/checkbox';
import { firstValueFrom } from 'rxjs';
import { Bus, CreateBusRequest, UpdateBusRequest } from '@/app/core/models/api.models';
import { ReferenceDataService } from '@/app/core/services/reference-data.service';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface BusFormModel {
    ownerName: string;
    ownerPhone: string;
    delegatePhone: string;
    sideNumber: string;
    plateNumber: string;
    seatCount: number;
    associationId: string;
    busLevelId: string;
    busTypeId: string;
    isActive: boolean;
}

@Component({
    selector: 'app-buses',
    standalone: true,
    providers: [ConfirmationService, MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, ToolbarModule, ConfirmDialogModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-confirmdialog />

        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Bus" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="buses()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Plate</th>
                    <th>Side #</th>
                    <th>Owner</th>
                    <th>Association</th>
                    <th>Level</th>
                    <th>Type</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-bus>
                <tr>
                    <td>{{ bus.plateNumber }}</td>
                    <td>{{ bus.sideNumber }}</td>
                    <td>{{ bus.ownerName }}</td>
                    <td>{{ bus.association.code }}</td>
                    <td>{{ bus.busLevel.code }}</td>
                    <td>{{ bus.busType.name }}</td>
                    <td>{{ bus.seatCount }}</td>
                    <td>
                        <p-tag [value]="bus.isActive ? 'Active' : 'Inactive'" [severity]="bus.isActive ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editBus(bus)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Bus' : 'New Bus'" [modal]="true" [style]="{ width: '560px' }">
            <form (submit)="saveBus($event)" class="flex flex-col gap-3">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="font-medium block mb-2">Association</label>
                        <select class="w-full p-inputtext" [field]="busForm.associationId">
                            <option value="">Default</option>
                            @for (item of reference.associations(); track item.id) {
                                <option [value]="item.id">{{ item.name }}</option>
                            }
                        </select>
                    </div>
                    <div>
                        <label class="font-medium block mb-2">Bus Level</label>
                        <select class="w-full p-inputtext" [field]="busForm.busLevelId">
                            <option value="">Select level</option>
                            @for (item of reference.busLevels(); track item.id) {
                                <option [value]="item.id">{{ item.code }}</option>
                            }
                        </select>
                        <app-field-errors [field]="busForm.busLevelId" />
                    </div>
                    <div>
                        <label class="font-medium block mb-2">Bus Type</label>
                        <select class="w-full p-inputtext" [field]="busForm.busTypeId">
                            <option value="">Select type</option>
                            @for (item of reference.busTypes(); track item.id) {
                                <option [value]="item.id">{{ item.name }}</option>
                            }
                        </select>
                        <app-field-errors [field]="busForm.busTypeId" />
                    </div>
                </div>
                <div>
                    <label class="font-medium block mb-2">Owner Name</label>
                    <input pInputText class="w-full" [field]="busForm.ownerName" />
                    <app-field-errors [field]="busForm.ownerName" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Owner Phone</label>
                    <input pInputText class="w-full" [field]="busForm.ownerPhone" />
                    <app-field-errors [field]="busForm.ownerPhone" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Delegate Phone</label>
                    <input pInputText class="w-full" [field]="busForm.delegatePhone" />
                    <app-field-errors [field]="busForm.delegatePhone" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Side Number</label>
                    <input pInputText class="w-full" [field]="busForm.sideNumber" />
                    <app-field-errors [field]="busForm.sideNumber" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Plate Number</label>
                    <input pInputText class="w-full" [field]="busForm.plateNumber" />
                    <app-field-errors [field]="busForm.plateNumber" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Seat Count</label>
                    <input type="number" pInputText class="w-full" [field]="busForm.seatCount" />
                    <app-field-errors [field]="busForm.seatCount" />
                </div>
                @if (editingId()) {
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="isActive" [field]="busForm.isActive" />
                        <label for="isActive">Active</label>
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
export class Buses implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);
    readonly reference = inject(ReferenceDataService);

    buses = signal<Bus[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    busModel = signal<BusFormModel>(this.emptyForm());
    busForm = form(this.busModel, (path) => {
        required(path.busLevelId, { message: 'Bus level is required' });
        required(path.busTypeId, { message: 'Bus type is required' });
        required(path.ownerName, { message: 'Owner name is required' });
        required(path.ownerPhone, { message: 'Owner phone is required' });
        pattern(path.ownerPhone, /^09\d{8}$/, { message: 'Use format 09XXXXXXXX' });
        required(path.delegatePhone, { message: 'Delegate phone is required' });
        pattern(path.delegatePhone, /^09\d{8}$/, { message: 'Use format 09XXXXXXXX' });
        required(path.sideNumber, { message: 'Side number is required' });
        required(path.plateNumber, { message: 'Plate number is required' });
        minLength(path.plateNumber, 3, { message: 'Plate number is too short' });
        min(path.seatCount, 1, { message: 'Seat count must be at least 1' });
    });

    ngOnInit() {
        void this.loadBuses();
    }

    async loadBuses() {
        this.loading.set(true);
        try {
            await this.reference.ensureLoaded();
            this.buses.set(await firstValueFrom(this.api.getBuses()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.editingId.set(null);
        this.busModel.set(this.emptyForm());
        this.dialogVisible = true;
    }

    editBus(bus: Bus) {
        this.editingId.set(bus.id);
        this.busModel.set({
            ownerName: bus.ownerName,
            ownerPhone: bus.ownerPhone,
            delegatePhone: bus.delegatePhone,
            sideNumber: bus.sideNumber,
            plateNumber: bus.plateNumber,
            seatCount: bus.seatCount,
            associationId: bus.association.id,
            busLevelId: bus.busLevel.id,
            busTypeId: bus.busType.id,
            isActive: bus.isActive
        });
        this.dialogVisible = true;
    }

    async saveBus(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.busForm, async () => {
                const model = this.busModel();
                const id = this.editingId();
                const classification = {
                    associationId: model.associationId || null,
                    busLevelId: model.busLevelId || null,
                    busTypeId: model.busTypeId || null
                };

                if (id) {
                    const request: UpdateBusRequest = { ...model, ...classification };
                    await firstValueFrom(this.api.updateBus(id, request));
                } else {
                    const request: CreateBusRequest = {
                        ownerName: model.ownerName,
                        ownerPhone: model.ownerPhone,
                        delegatePhone: model.delegatePhone,
                        sideNumber: model.sideNumber,
                        plateNumber: model.plateNumber,
                        seatCount: model.seatCount,
                        ...classification
                    };
                    await firstValueFrom(this.api.createBus(request));
                }

                this.dialogVisible = false;
                this.reference.reset();
                await this.loadBuses();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Bus saved successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private emptyForm(): BusFormModel {
        const levels = this.reference.busLevels();
        const types = this.reference.busTypes();
        const associations = this.reference.associations();
        return {
            ownerName: '',
            ownerPhone: '',
            delegatePhone: '',
            sideNumber: '',
            plateNumber: '',
            seatCount: 45,
            associationId: associations[0]?.id ?? '',
            busLevelId: levels[0]?.id ?? '',
            busTypeId: types[0]?.id ?? '',
            isActive: true
        };
    }
}
