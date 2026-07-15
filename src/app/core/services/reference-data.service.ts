import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AssociationRef, BusLevelRef, BusTypeRef } from '@/app/core/models/api.models';
import { TicketApiService } from '@/app/core/services/ticket-api.service';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
    private readonly api = inject(TicketApiService);

    readonly associations = signal<AssociationRef[]>([]);
    readonly busLevels = signal<BusLevelRef[]>([]);
    readonly busTypes = signal<BusTypeRef[]>([]);

    private loaded = false;

    async ensureLoaded() {
        if (this.loaded) {
            return;
        }

        try {
            const [associations, busLevels, busTypes] = await Promise.all([
                firstValueFrom(this.api.getAssociations()),
                firstValueFrom(this.api.getBusLevels()),
                firstValueFrom(this.api.getBusTypes())
            ]);

            this.associations.set(
                associations
                    .filter((item) => item.isActive)
                    .map<AssociationRef>(({ id, name, code }) => ({ id, name, code }))
                    .sort((a, b) => a.name.localeCompare(b.name))
            );
            this.busLevels.set(
                busLevels
                    .filter((item) => item.isActive)
                    .map<BusLevelRef>(({ id, code, name, rank }) => ({ id, code, name, rank }))
                    .sort((a, b) => a.rank - b.rank)
            );
            this.busTypes.set(
                busTypes
                    .filter((item) => item.isActive)
                    .map<BusTypeRef>(({ id, code, name }) => ({ id, code, name }))
                    .sort((a, b) => a.name.localeCompare(b.name))
            );
        } catch {
            const [buses, tariffs] = await Promise.all([
                firstValueFrom(this.api.getBuses()),
                firstValueFrom(this.api.getActiveTariffs()).catch(() => [])
            ]);

            const associationMap = new Map<string, AssociationRef>();
            const levelMap = new Map<string, BusLevelRef>();
            const typeMap = new Map<string, BusTypeRef>();

            for (const bus of buses) {
                associationMap.set(bus.association.id, bus.association);
                levelMap.set(bus.busLevel.id, bus.busLevel);
                typeMap.set(bus.busType.id, bus.busType);
            }

            for (const tariff of tariffs) {
                levelMap.set(tariff.busLevel.id, tariff.busLevel);
                typeMap.set(tariff.busType.id, tariff.busType);
            }

            this.associations.set([...associationMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
            this.busLevels.set([...levelMap.values()].sort((a, b) => a.rank - b.rank));
            this.busTypes.set([...typeMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
        }

        this.loaded = true;
    }

    reset() {
        this.loaded = false;
        this.associations.set([]);
        this.busLevels.set([]);
        this.busTypes.set([]);
    }
}
