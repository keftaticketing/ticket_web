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
import { Association, CreateAssociationRequest, UpdateAssociationRequest } from '@/app/core/models/api.models';
import { ReferenceDataService } from '@/app/core/services/reference-data.service';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface AssociationFormModel {
    name: string;
    code: string;
    shortName: string;
    memberCount: string;
    contactPhone: string;
    isActive: boolean;
}

@Component({
    selector: 'app-associations',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, TableModule, DialogModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, ToolbarModule, Field, FieldErrors],
    template: `
        <p-toast />
        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Association" icon="pi pi-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="associations()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Short Name</th>
                    <th>Members</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-item>
                <tr>
                    <td>{{ item.code }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.shortName || '�' }}</td>
                    <td>{{ item.memberCount ?? '�' }}</td>
                    <td>{{ item.contactPhone || '�' }}</td>
                    <td><p-tag [value]="item.isActive ? 'Active' : 'Inactive'" [severity]="item.isActive ? 'success' : 'danger'" /></td>
                    <td><p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editAssociation(item)" /></td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Edit Association' : 'New Association'" [modal]="true" [style]="{ width: '520px' }">
            <form (submit)="saveAssociation($event)" class="flex flex-col gap-3">
                <div>
                    <label class="font-medium block mb-2">Name</label>
                    <input pInputText class="w-full" [field]="associationForm.name" />
                    <app-field-errors [field]="associationForm.name" />
                </div>
                @if (!editingId()) {
                    <div>
                        <label class="font-medium block mb-2">Code</label>
                        <input pInputText class="w-full" [field]="associationForm.code" />
                        <app-field-errors [field]="associationForm.code" />
                    </div>
                }
                <div>
                    <label class="font-medium block mb-2">Short Name</label>
                    <input pInputText class="w-full" [field]="associationForm.shortName" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Member Count</label>
                    <input pInputText type="number" class="w-full" [field]="associationForm.memberCount" />
                    <app-field-errors [field]="associationForm.memberCount" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Contact Phone</label>
                    <input pInputText class="w-full" [field]="associationForm.contactPhone" />
                    <app-field-errors [field]="associationForm.contactPhone" />
                </div>
                @if (editingId()) {
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="associationActive" [field]="associationForm.isActive" />
                        <label for="associationActive">Active</label>
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
export class Associations implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);
    private readonly reference = inject(ReferenceDataService);

    associations = signal<Association[]>([]);
    loading = signal(false);
    saving = signal(false);
    dialogVisible = false;
    editingId = signal<string | null>(null);

    associationModel = signal<AssociationFormModel>(this.emptyForm());
    associationForm = form(this.associationModel, (path) => {
        required(path.name, { message: 'Name is required' });
        required(path.code, { message: 'Code is required' });
        minLength(path.code, 2, { message: 'Code must be at least 2 characters' });
        pattern(path.code, /^[A-Za-z0-9_-]+$/, { message: 'Use only letters, numbers, dash, or underscore' });
        pattern(path.memberCount, /^$|^\d+$/, { message: 'Member count must be a whole number' });
        pattern(path.contactPhone, /^$|^09\d{8}$/, { message: 'Use format 09XXXXXXXX' });
    });

    ngOnInit() {
        void this.loadAssociations();
    }

    async loadAssociations() {
        this.loading.set(true);
        try {
            this.associations.set(await firstValueFrom(this.api.getAssociations()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    openNew() {
        this.editingId.set(null);
        this.associationModel.set(this.emptyForm());
        this.dialogVisible = true;
    }

    editAssociation(item: Association) {
        this.editingId.set(item.id);
        this.associationModel.set({
            name: item.name,
            code: item.code,
            shortName: item.shortName ?? '',
            memberCount: item.memberCount?.toString() ?? '',
            contactPhone: item.contactPhone ?? '',
            isActive: item.isActive
        });
        this.dialogVisible = true;
    }

    async saveAssociation(event: Event) {
        event.preventDefault();
        this.saving.set(true);
        try {
            await submit(this.associationForm, async () => {
                const model = this.associationModel();
                const id = this.editingId();
                if (id) {
                    const request: UpdateAssociationRequest = {
                        name: model.name,
                        shortName: model.shortName.trim() || null,
                        memberCount: model.memberCount.trim() ? Number(model.memberCount) : null,
                        contactPhone: model.contactPhone.trim() || null,
                        isActive: model.isActive
                    };
                    await firstValueFrom(this.api.updateAssociation(id, request));
                } else {
                    const request: CreateAssociationRequest = {
                        name: model.name,
                        code: model.code.trim(),
                        shortName: model.shortName.trim() || null,
                        memberCount: model.memberCount.trim() ? Number(model.memberCount) : null,
                        contactPhone: model.contactPhone.trim() || null
                    };
                    await firstValueFrom(this.api.createAssociation(request));
                }
                this.dialogVisible = false;
                this.reference.reset();
                await this.loadAssociations();
                this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Association saved successfully' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.saving.set(false);
        }
    }

    private emptyForm(): AssociationFormModel {
        return { name: '', code: '', shortName: '', memberCount: '', contactPhone: '', isActive: true };
    }
}
