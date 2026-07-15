import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Field, form, minLength, pattern, required, submit, validate, validateTree } from '@angular/forms/signals';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { firstValueFrom } from 'rxjs';
import {
    CreateTicketerRequest,
    CreateUserStationAssignmentRequest,
    Route,
    RouteStation,
    UserStationAssignment,
    UserSummary
} from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';
import { FieldErrors } from '@/app/shared/components/field-errors';
import { passwordPolicy } from '@/app/shared/validators/password.validators';
import { getApiErrorMessage } from '@/app/shared/utils/api-error';

interface TicketerFormModel {
    username: string;
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface StationAssignmentFormModel {
    stationId: string;
}

@Component({
    selector: 'app-users',
    standalone: true,
    providers: [ConfirmationService, MessageService],
    imports: [
        CommonModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        ConfirmDialogModule,
        Field,
        FieldErrors
    ],
    template: `
        <p-toast />
        <p-confirmdialog />

        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="New Ticketer" icon="pi pi-user-plus" (onClick)="openNew()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="users()" [loading]="loading()" [paginator]="true" [rows]="10" dataKey="id">
            <ng-template #header>
                <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Password</th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-user>
                <tr>
                    <td>{{ user.username }}</td>
                    <td>{{ user.fullName }}</td>
                    <td>
                        <p-tag [value]="user.role" [severity]="user.role === 'Admin' ? 'info' : 'secondary'" />
                    </td>
                    <td>
                        <p-tag [value]="user.isActive ? 'Active' : 'Inactive'" [severity]="user.isActive ? 'success' : 'danger'" />
                    </td>
                    <td>
                        @if (user.mustChangePassword) {
                            <p-tag value="Change required" severity="warn" />
                        } @else {
                            <span class="text-muted-color">Set</span>
                        }
                    </td>
                    <td class="flex gap-2">
                        @if (user.role === 'Ticketer') {
                            <p-button
                                icon="pi pi-map-marker"
                                [rounded]="true"
                                [outlined]="true"
                                severity="info"
                                (onClick)="openStationAssignments(user)"
                            />
                            <p-button
                                [label]="user.isActive ? 'Deactivate' : 'Activate'"
                                [icon]="user.isActive ? 'pi pi-ban' : 'pi pi-check'"
                                [severity]="user.isActive ? 'danger' : 'success'"
                                [outlined]="true"
                                size="small"
                                [loading]="togglingId() === user.id"
                                (onClick)="confirmToggleActive(user)"
                            />
                        }
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="dialogVisible" header="New Ticketer" [modal]="true" [style]="{ width: '520px' }">
            <p class="text-muted-color mt-0 mb-4">Ticketers must change their password on first login.</p>
            <form (submit)="saveTicketer($event)" class="flex flex-col gap-3">
                <div>
                    <label class="font-medium block mb-2">Username</label>
                    <input pInputText class="w-full" [field]="ticketerForm.username" autocomplete="off" />
                    <app-field-errors [field]="ticketerForm.username" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Full Name</label>
                    <input pInputText class="w-full" [field]="ticketerForm.fullName" />
                    <app-field-errors [field]="ticketerForm.fullName" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Email (optional)</label>
                    <input pInputText type="email" class="w-full" [field]="ticketerForm.email" />
                    <app-field-errors [field]="ticketerForm.email" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Temporary Password</label>
                    <p-password placeholder="Temporary password" [toggleMask]="true" styleClass="w-full" [fluid]="true" [feedback]="true" [field]="ticketerForm.password" />
                    <app-field-errors [field]="ticketerForm.password" />
                </div>
                <div>
                    <label class="font-medium block mb-2">Confirm Password</label>
                    <p-password placeholder="Confirm password" [toggleMask]="true" styleClass="w-full" [fluid]="true" [feedback]="false" [field]="ticketerForm.confirmPassword" />
                    <app-field-errors [field]="ticketerForm.confirmPassword" />
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <p-button type="button" label="Cancel" severity="secondary" (onClick)="dialogVisible = false" />
                    <p-button type="submit" label="Create" [loading]="saving()" />
                </div>
            </form>
        </p-dialog>

        <p-dialog
            [(visible)]="stationDialogVisible"
            [header]="'Station assignments — ' + (selectedUser()?.username ?? '')"
            [modal]="true"
            [style]="{ width: '720px' }"
        >
            @if (selectedUser(); as user) {
                <form (submit)="assignStation($event)" class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-4">
                    <div class="md:col-span-2">
                        <label class="font-medium block mb-2">Assign station</label>
                        <select class="w-full p-inputtext" [field]="assignmentForm.stationId">
                            <option value="">Select station</option>
                            @for (station of stations(); track station.id) {
                                <option [value]="station.id">{{ station.name }} ({{ station.code }}) — {{ station.cityName }}</option>
                            }
                        </select>
                        <app-field-errors [field]="assignmentForm.stationId" />
                    </div>
                    <p-button type="submit" label="Assign" icon="pi pi-plus" [loading]="assigningStation()" />
                </form>

                <p-table [value]="stationAssignments()" [loading]="loadingAssignments()" dataKey="assignmentId">
                    <ng-template #header>
                        <tr>
                            <th>Station</th>
                            <th>City</th>
                            <th>Assigned</th>
                            <th>Ended</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-row>
                        <tr>
                            <td>{{ row.stationName }} ({{ row.stationCode }})</td>
                            <td>{{ row.cityName }}</td>
                            <td>{{ row.assignedAtUtc | date: 'medium' }}</td>
                            <td>{{ row.endedAtUtc ? (row.endedAtUtc | date: 'medium') : '—' }}</td>
                            <td>
                                <p-tag [value]="row.isActive ? 'Active' : 'Ended'" [severity]="row.isActive ? 'success' : 'secondary'" />
                            </td>
                            <td>
                                @if (row.isActive) {
                                    <p-button
                                        icon="pi pi-times"
                                        severity="danger"
                                        [rounded]="true"
                                        [outlined]="true"
                                        size="small"
                                        [loading]="endingAssignmentId() === row.assignmentId"
                                        (onClick)="confirmEndAssignment(user, row)"
                                    />
                                }
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </p-dialog>
    `
})
export class Users implements OnInit {
    private readonly api = inject(TicketApiService);
    private readonly messages = inject(MessageService);
    private readonly confirmation = inject(ConfirmationService);

    users = signal<UserSummary[]>([]);
    stations = signal<RouteStation[]>([]);
    stationAssignments = signal<UserStationAssignment[]>([]);
    selectedUser = signal<UserSummary | null>(null);

    loading = signal(false);
    saving = signal(false);
    togglingId = signal<string | null>(null);
    loadingAssignments = signal(false);
    assigningStation = signal(false);
    endingAssignmentId = signal<string | null>(null);

    dialogVisible = false;
    stationDialogVisible = false;

    ticketerModel = signal<TicketerFormModel>(this.emptyForm());
    ticketerForm = form(this.ticketerModel, (path) => {
        required(path.username, { message: 'Username is required' });
        minLength(path.username, 3, { message: 'Username must be at least 3 characters' });
        pattern(path.username, /^[a-zA-Z0-9._-]+$/, {
            message: 'Username can only contain letters, numbers, dots, dashes, and underscores'
        });
        required(path.fullName, { message: 'Full name is required' });
        validate(path.email, (ctx) => {
            const email = ctx.value()?.trim();
            if (!email) return null;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return { kind: 'email', message: 'Enter a valid email address' };
            }
            return null;
        });
        required(path.password, { message: 'Password is required' });
        passwordPolicy(path.password);
        required(path.confirmPassword, { message: 'Please confirm the password' });
        validateTree(path, (ctx) => {
            const password = ctx.fieldTree.password().value();
            const confirmPassword = ctx.fieldTree.confirmPassword().value();
            if (!confirmPassword || password === confirmPassword) return null;
            return { kind: 'mismatch', message: 'Passwords do not match', field: ctx.fieldTree.confirmPassword };
        });
    });

    assignmentModel = signal<StationAssignmentFormModel>({ stationId: '' });
    assignmentForm = form(this.assignmentModel, (path) => {
        required(path.stationId, { message: 'Station is required' });
    });

    ngOnInit() {
        void this.loadUsers();
        void this.loadStations();
    }

    async loadUsers() {
        this.loading.set(true);
        try {
            this.users.set(await firstValueFrom(this.api.getUsers()));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loading.set(false);
        }
    }

    async loadStations() {
        try {
            const routes = await firstValueFrom(this.api.getRoutes());
            this.stations.set(this.collectStations(routes));
        } catch {
            this.stations.set([]);
        }
    }

    openNew() {
        this.ticketerModel.set(this.emptyForm());
        this.dialogVisible = true;
    }

    async openStationAssignments(user: UserSummary) {
        this.selectedUser.set(user);
        this.assignmentModel.set({ stationId: '' });
        this.stationDialogVisible = true;
        await this.loadStationAssignments(user.id);
    }

    async loadStationAssignments(userId: string) {
        this.loadingAssignments.set(true);
        try {
            this.stationAssignments.set(await firstValueFrom(this.api.getUserStationAssignments(userId)));
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.loadingAssignments.set(false);
        }
    }

    confirmToggleActive(user: UserSummary) {
        const activating = !user.isActive;
        this.confirmation.confirm({
            message: activating
                ? `Activate ticketer "${user.username}"?`
                : `Deactivate ticketer "${user.username}"? They will be signed out and cannot sell tickets.`,
            header: activating ? 'Activate User' : 'Deactivate User',
            icon: activating ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle',
            accept: () => void this.toggleActive(user, activating)
        });
    }

    confirmEndAssignment(user: UserSummary, assignment: UserStationAssignment) {
        this.confirmation.confirm({
            message: `End assignment at ${assignment.stationName}?`,
            header: 'End Station Assignment',
            icon: 'pi pi-exclamation-triangle',
            accept: () => void this.endAssignment(user, assignment)
        });
    }

    async toggleActive(user: UserSummary, isActive: boolean) {
        this.togglingId.set(user.id);
        try {
            await firstValueFrom(this.api.setUserActive(user.id, { isActive }));
            await this.loadUsers();
            this.messages.add({
                severity: 'success',
                summary: isActive ? 'Activated' : 'Deactivated',
                detail: `${user.username} is now ${isActive ? 'active' : 'inactive'}`
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.togglingId.set(null);
        }
    }

    async assignStation(event: Event) {
        event.preventDefault();
        const user = this.selectedUser();
        if (!user) return;

        this.assigningStation.set(true);
        try {
            await submit(this.assignmentForm, async () => {
                const request: CreateUserStationAssignmentRequest = {
                    stationId: this.assignmentModel().stationId
                };
                await firstValueFrom(this.api.assignUserStation(user.id, request));
                this.assignmentModel.set({ stationId: '' });
                await this.loadStationAssignments(user.id);
                this.messages.add({ severity: 'success', summary: 'Assigned', detail: 'Station assignment created' });
            });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.assigningStation.set(false);
        }
    }

    async endAssignment(user: UserSummary, assignment: UserStationAssignment) {
        this.endingAssignmentId.set(assignment.assignmentId);
        try {
            await firstValueFrom(this.api.endUserStationAssignment(user.id, assignment.assignmentId));
            await this.loadStationAssignments(user.id);
            this.messages.add({ severity: 'success', summary: 'Ended', detail: 'Station assignment ended' });
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'Error', detail: getApiErrorMessage(error) });
        } finally {
            this.endingAssignmentId.set(null);
        }
    }

    async saveTicketer(event: Event) {
        event.preventDefault();
        this.saving.set(true);

        try {
            await submit(this.ticketerForm, async () => {
                const model = this.ticketerModel();
                const request: CreateTicketerRequest = {
                    username: model.username.trim(),
                    fullName: model.fullName.trim(),
                    password: model.password,
                    email: model.email.trim() || null
                };
                await firstValueFrom(this.api.createTicketer(request));
                this.dialogVisible = false;
                await this.loadUsers();
                this.messages.add({
                    severity: 'success',
                    summary: 'Created',
                    detail: `Ticketer "${request.username}" created. They must change password on first login.`
                });
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
        return [...map.values()].sort((a, b) => a.cityName.localeCompare(b.cityName) || a.name.localeCompare(b.name));
    }

    private emptyForm(): TicketerFormModel {
        return { username: '', fullName: '', email: '', password: '', confirmPassword: '' };
    }
}
