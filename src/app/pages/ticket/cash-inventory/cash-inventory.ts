import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, submit } from '@angular/forms/signals';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { firstValueFrom } from 'rxjs';
import { CashInventory, CashLedgerEntry, SalesParty } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface LedgerFilterModel {
    salesPartyId: string;
}

@Component({
    selector: 'app-cash-inventory',
    standalone: true,
    providers: [MessageService],
    imports: [CommonModule, CardModule, TableModule, ButtonModule, ToastModule, Field],
    template: `
        <p-toast />

        <p-card header="Cash Balances" styleClass="mb-4">
            <p-table [value]="inventory()" [loading]="loadingInventory()" [paginator]="true" [rows]="10">
                <ng-template #header>
                    <tr>
                        <th>Party</th>
                        <th>Code</th>
                        <th>Source</th>
                        <th>Balance (ETB)</th>
                        <th>Updated</th>
                    </tr>
                </ng-template>
                <ng-template #body let-item>
                    <tr>
                        <td>{{ item.partyName }}</td>
                        <td>{{ item.partyCode }}</td>
                        <td>{{ item.source }}</td>
                        <td>{{ item.balanceEtb | number: '1.2-2' }}</td>
                        <td>{{ item.updatedAt | date: 'medium' }}</td>
                    </tr>
                </ng-template>
            </p-table>
        </p-card>

        <p-card header="Ledger">
            <form (submit)="loadLedger($event)" class="flex flex-wrap items-end gap-3 mb-4">
                <div class="flex flex-col gap-2 min-w-64">
                    <label class="font-medium">Sales Party</label>
                    <select class="p-inputtext w-full" [field]="filterForm.salesPartyId">
                        <option value="">All parties</option>
                        @for (party of parties(); track party.id) {
                            <option [value]="party.id">{{ party.name }} ({{ party.code }})</option>
                        }
                    </select>
                </div>
                <p-button type="submit" label="Load Ledger" icon="pi pi-search" [loading]="loadingLedger()" />
            </form>

            <p-table [value]="ledger()" [loading]="loadingLedger()" [paginator]="true" [rows]="15">
                <ng-template #header>
                    <tr>
                        <th>When</th>
                        <th>Party</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance After</th>
                        <th>Ticket</th>
                    </tr>
                </ng-template>
                <ng-template #body let-entry>
                    <tr>
                        <td>{{ entry.occurredAt | date: 'medium' }}</td>
                        <td>{{ entry.partyName }}</td>
                        <td>{{ entry.entryType }}</td>
                        <td>{{ entry.amountEtb | number: '1.2-2' }}</td>
                        <td>{{ entry.balanceAfterEtb | number: '1.2-2' }}</td>
                        <td>{{ entry.ticketId }}</td>
                    </tr>
                </ng-template>
            </p-table>
        </p-card>
    `
})
export class CashInventoryPage implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);

    inventory = signal<CashInventory[]>([]);
    ledger = signal<CashLedgerEntry[]>([]);
    parties = signal<SalesParty[]>([]);
    loadingInventory = signal(false);
    loadingLedger = signal(false);

    filterModel = signal<LedgerFilterModel>({ salesPartyId: '' });
    filterForm = form(this.filterModel);

    ngOnInit() {
        void this.loadInventory();
        void this.loadParties();
        void this.loadLedgerEntries();
    }

    async loadInventory() {
        this.loadingInventory.set(true);
        try {
            this.inventory.set(await firstValueFrom(this.api.getCashInventory()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loadingInventory.set(false);
        }
    }

    async loadParties() {
        try {
            this.parties.set(await firstValueFrom(this.api.getSalesParties()));
        } catch {
            // Ledger filter is optional; inventory card still works.
        }
    }

    async loadLedger(event?: Event) {
        event?.preventDefault();
        await this.loadLedgerEntries();
    }

    private async loadLedgerEntries() {
        this.loadingLedger.set(true);
        try {
            const partyId = this.filterModel().salesPartyId || undefined;
            this.ledger.set(await firstValueFrom(this.api.getCashLedger(partyId)));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loadingLedger.set(false);
        }
    }
}
