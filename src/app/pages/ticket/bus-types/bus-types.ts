import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, minLength, pattern, required, submit } from '@angular/forms/signals';
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
import { BusType, CreateBusTypeRequest, UpdateBusTypeRequest } from '@/app/core/models/api.models';
import { ReferenceDataService } from '@/app/core/services/reference-data.service';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface BusTypeFormModel {
    code: string;
    name: string;
    isActive: boolean;
}

@Component({
    selector: 'app-bus-types',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Bus Type" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="busTypes()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-item>
                <tr>
                    <td>{{ item.code }}</td>
                    <td>{{ item.name }}</td>
                    <td><p-tag [value]="item.isActive ? 'Active' : 'Inactive'" [severity]="item.isActive ? 'success' : 'danger'" /></td>
                    <td><p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editBusType(item)" /></td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Bus Type' : 'New Bus Type'" [modal]="true" [style]="{ width: '480px' }">
            <form (submit)="saveBusType($event)" class="flex flex-col gap-3">
                @if (!editingId()) {
                    <div>
                        <label class="font-medium block mb-2">Code</label>
                        <input pInputText class="w-full" [field]="busTypeForm.code" />
                        <app-field-errors [field]="busTypeForm.code" />
                    </div>
                }
                <div>
                    <label class="font-medium block mb-2">Name</label>
                    <input pInputText class="w-full" [field]="busTypeForm.name" />
                    <app-field-errors [field]="busTypeForm.name" />
                </div>
                @if (editingId()) {
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="busTypeActive" [field]="busTypeForm.isActive" />
                        <label for="busTypeActive">Active</label>
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
export class BusTypes implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);
    private readonly reference = inject(ReferenceDataService);

    busTypes = signal<BusType[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    busTypeModel = signal<BusTypeFormModel>(this.emptyForm());
    busTypeForm = form(this.busTypeModel, (path) => {
        required(path.code, { message: 'Code is required' });
        minLength(path.code, 2, { message: 'Code must be at least 2 characters' });
        pattern(path.code, /^[A-Za-z0-9_-]+$/, { message: 'Use only letters, numbers, dash, or underscore' });
        required(path.name, { message: 'Name is required' });
    });

    ngOnInit() {
        void this.loadBusTypes();
    }

    async loadBusTypes() {
        this.loading.set(true);
        try {
            this.busTypes.set(await firstValueFrom(this.api.getBusTypes()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.editingId.set(null);
        this.busTypeModel.set(this.emptyForm());
        this.dialogVisible = true;
    }

    editBusType(item: BusType) {
        this.editingId.set(item.id);
        this.busTypeModel.set({ code: item.code, name: item.name, isActive: item.isActive });
        this.dialogVisible = true;
    }

    async saveBusType(event: Event) {
        event.preventDefault();
        this.saving.set(true);
        try {
            await submit(this.busTypeForm, async () => {
                const model = this.busTypeModel();
                const id = this.editingId();
                if (id) {
                    const request: UpdateBusTypeRequest = { name: model.name, isActive: model.isActive };
                    await firstValueFrom(this.api.updateBusType(id, request));
                } else {
                    const request: CreateBusTypeRequest = { code: model.code.trim(), name: model.name };
                    await firstValueFrom(this.api.createBusType(request));
                }
                this.dialogVisible = false;
                this.reference.reset();
                await this.loadBusTypes();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Bus type saved successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private emptyForm(): BusTypeFormModel {
        return { code: '', name: '', isActive: true };
    }
}
