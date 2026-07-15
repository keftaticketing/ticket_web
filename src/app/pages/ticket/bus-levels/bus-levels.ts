import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, min, minLength, pattern, required, submit } from '@angular/forms/signals';
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
import { BusLevel, CreateBusLevelRequest, UpdateBusLevelRequest } from '@/app/core/models/api.models';
import { ReferenceDataService } from '@/app/core/services/reference-data.service';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface BusLevelFormModel {
    code: string;
    name: string;
    rank: number;
    isActive: boolean;
}

@Component({
    selector: 'app-bus-levels',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Bus Level" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="busLevels()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Rank</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-item>
                <tr>
                    <td>{{ item.code }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.rank }}</td>
                    <td><p-tag [value]="item.isActive ? 'Active' : 'Inactive'" [severity]="item.isActive ? 'success' : 'danger'" /></td>
                    <td><p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editBusLevel(item)" /></td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Bus Level' : 'New Bus Level'" [modal]="true" [style]="{ width: '480px' }">
            <form (submit)="saveBusLevel($event)" class="flex flex-col gap-3">
                @if (!editingId()) {
                    <div>
                        <label class="font-medium block mb-2">Code</label>
                        <input pInputText class="w-full" [field]="busLevelForm.code" />
                        <app-field-errors [field]="busLevelForm.code" />
                    </div>
                }
                <div>
                    <label class="font-medium block mb-2">Name</label>
                    <input pInputText class="w-full" [field]="busLevelForm.name" />
                    <app-field-errors [field]="busLevelForm.name" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Rank</label>
                    <input type="number" pInputText class="w-full" [field]="busLevelForm.rank" />
                    <app-field-errors [field]="busLevelForm.rank" />
                </div>
                @if (editingId()) {
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="busLevelActive" [field]="busLevelForm.isActive" />
                        <label for="busLevelActive">Active</label>
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
export class BusLevels implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);
    private readonly reference = inject(ReferenceDataService);

    busLevels = signal<BusLevel[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    busLevelModel = signal<BusLevelFormModel>(this.emptyForm());
    busLevelForm = form(this.busLevelModel, (path) => {
        required(path.code, { message: 'Code is required' });
        minLength(path.code, 2, { message: 'Code must be at least 2 characters' });
        pattern(path.code, /^[A-Za-z0-9_-]+$/, { message: 'Use only letters, numbers, dash, or underscore' });
        required(path.name, { message: 'Name is required' });
        min(path.rank, 0, { message: 'Rank cannot be negative' });
    });

    ngOnInit() {
        void this.loadBusLevels();
    }

    async loadBusLevels() {
        this.loading.set(true);
        try {
            this.busLevels.set(await firstValueFrom(this.api.getBusLevels()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.editingId.set(null);
        this.busLevelModel.set(this.emptyForm());
        this.dialogVisible = true;
    }

    editBusLevel(item: BusLevel) {
        this.editingId.set(item.id);
        this.busLevelModel.set({ code: item.code, name: item.name, rank: item.rank, isActive: item.isActive });
        this.dialogVisible = true;
    }

    async saveBusLevel(event: Event) {
        event.preventDefault();
        this.saving.set(true);
        try {
            await submit(this.busLevelForm, async () => {
                const model = this.busLevelModel();
                const id = this.editingId();
                if (id) {
                    const request: UpdateBusLevelRequest = { name: model.name, rank: model.rank, isActive: model.isActive };
                    await firstValueFrom(this.api.updateBusLevel(id, request));
                } else {
                    const request: CreateBusLevelRequest = { code: model.code.trim(), name: model.name, rank: model.rank };
                    await firstValueFrom(this.api.createBusLevel(request));
                }
                this.dialogVisible = false;
                this.reference.reset();
                await this.loadBusLevels();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Bus level saved successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private emptyForm(): BusLevelFormModel {
        return { code: '', name: '', rank: 0, isActive: true };
    }
}
