import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, min, minLength, required, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CheckboxModule } from 'primeng/checkbox';
import { firstValueFrom } from 'rxjs';
import { CreateSalesPartyRequest, SALES_PARTY_ALLOCATION_TYPES, SALES_PARTY_SOURCES, SalesParty, UpdateSalesPartyRequest } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface SalesPartyFormModel {
    name: string;
    code: string;
    amountPerSeatEtb: number;
    source: string;
    allocationType: string;
    sortOrder: number;
    isActive: boolean;
}

@Component({
    selector: 'app-sales-parties',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, TagModule, ToastModule, ToolbarModule, CheckboxModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Sales Party" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="parties()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Amount/seat</th>
                    <th>Source</th>
                    <th>Allocation</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-party>
                <tr>
                    <td>{{ party.code }}</td>
                    <td>{{ party.name }}</td>
                    <td>{{ party.amountPerSeatEtb | number: '1.2-2' }} ETB</td>
                    <td>{{ party.source }}</td>
                    <td>{{ party.allocationType }}</td>
                    <td>{{ party.sortOrder }}</td>
                    <td>
                        <p-tag [value]="party.isActive ? 'Active' : 'Inactive'" [severity]="party.isActive ? 'success' : 'danger'" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editParty(party)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Sales Party' : 'New Sales Party'" [modal]="true" [style]="{ width: '520px' }">
            <form (submit)="saveParty($event)" class="flex flex-col gap-3">
                <div>
                    <label class="font-medium block mb-2">Name</label>
                    <input pInputText class="w-full" [field]="partyForm.name" />
                    <app-field-errors [field]="partyForm.name" />
                </div>
                @if (!editingId()) {
                    <div>
                        <label class="font-medium block mb-2">Code</label>
                        <input pInputText class="w-full" [field]="partyForm.code" />
                        <app-field-errors [field]="partyForm.code" />
                    </div>
                }
                <div>
                    <label class="font-medium block mb-2">Amount per seat (ETB)</label>
                    <input type="number" step="0.01" pInputText class="w-full" [field]="partyForm.amountPerSeatEtb" />
                    <app-field-errors [field]="partyForm.amountPerSeatEtb" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Source</label>
                    <select class="w-full p-inputtext" [field]="partyForm.source">
                        @for (source of sources; track source) {
                            <option [value]="source">{{ source }}</option>
                        }
                    </select>
                    <app-field-errors [field]="partyForm.source" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Allocation Type</label>
                    <select class="w-full p-inputtext" [field]="partyForm.allocationType">
                        @for (type of allocationTypes; track type) {
                            <option [value]="type">{{ type }}</option>
                        }
                    </select>
                    <app-field-errors [field]="partyForm.allocationType" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Sort Order</label>
                    <input type="number" pInputText class="w-full" [field]="partyForm.sortOrder" />
                    <app-field-errors [field]="partyForm.sortOrder" />
                </div>
                @if (editingId()) {
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="partyActive" [field]="partyForm.isActive" />
                        <label for="partyActive">Active</label>
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
export class SalesParties implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    readonly sources = SALES_PARTY_SOURCES;
    readonly allocationTypes = SALES_PARTY_ALLOCATION_TYPES;

    parties = signal<SalesParty[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    partyModel = signal<SalesPartyFormModel>(this.emptyForm());
    partyForm = form(this.partyModel, (path) => {
        required(path.name, { message: 'Name is required' });
        required(path.code, { message: 'Code is required' });
        minLength(path.code, 2, { message: 'Code must be at least 2 characters' });
        min(path.amountPerSeatEtb, 0, { message: 'Amount cannot be negative' });
        required(path.source, { message: 'Source is required' });
        required(path.allocationType, { message: 'Allocation type is required' });
        min(path.sortOrder, 0, { message: 'Sort order cannot be negative' });
    });

    ngOnInit() {
        void this.loadParties();
    }

    async loadParties() {
        this.loading.set(true);
        try {
            this.parties.set(await firstValueFrom(this.api.getSalesParties()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.editingId.set(null);
        this.partyModel.set(this.emptyForm());
        this.dialogVisible = true;
    }

    editParty(party: SalesParty) {
        this.editingId.set(party.id);
        this.partyModel.set({
            name: party.name,
            code: party.code,
            amountPerSeatEtb: party.amountPerSeatEtb,
            source: party.source,
            allocationType: party.allocationType,
            sortOrder: party.sortOrder,
            isActive: party.isActive
        });
        this.dialogVisible = true;
    }

    async saveParty(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.partyForm, async () => {
                const model = this.partyModel();
                const id = this.editingId();

                if (id) {
                    const request: UpdateSalesPartyRequest = {
                        name: model.name,
                        amountPerSeatEtb: model.amountPerSeatEtb,
                        source: model.source,
                        allocationType: model.allocationType,
                        sortOrder: model.sortOrder,
                        isActive: model.isActive
                    };
                    await firstValueFrom(this.api.updateSalesParty(id, request));
                } else {
                    const request: CreateSalesPartyRequest = {
                        name: model.name,
                        code: model.code,
                        amountPerSeatEtb: model.amountPerSeatEtb,
                        source: model.source,
                        allocationType: model.allocationType,
                        sortOrder: model.sortOrder
                    };
                    await firstValueFrom(this.api.createSalesParty(request));
                }

                this.dialogVisible = false;
                await this.loadParties();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Sales party saved successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private emptyForm(): SalesPartyFormModel {
        return {
            name: '',
            code: '',
            amountPerSeatEtb: 0,
            source: 'SalesFee',
            allocationType: 'FixedAmount',
            sortOrder: 0,
            isActive: true
        };
    }
}
