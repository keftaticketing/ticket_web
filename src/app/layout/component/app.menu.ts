import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [
        {
            label: 'Dashboard',
            items: [
                { label: 'Reports', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/'] },
                { label: 'Tickets', icon: 'pi pi-fw pi-ticket', routerLink: ['/ticket/tickets'] }
            ]
        },
        {
            label: 'Operations',
            items: [
                { label: 'Associations', icon: 'pi pi-fw pi-sitemap', routerLink: ['/ticket/associations'] },
                { label: 'Buses', icon: 'pi pi-fw pi-truck', routerLink: ['/ticket/buses'] },
                { label: 'Bus Levels', icon: 'pi pi-fw pi-sort-numeric-up', routerLink: ['/ticket/bus-levels'] },
                { label: 'Bus Types', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/ticket/bus-types'] },
                { label: 'Cities', icon: 'pi pi-fw pi-map-marker', routerLink: ['/ticket/cities'] },
                { label: 'Routes', icon: 'pi pi-fw pi-directions', routerLink: ['/ticket/routes'] },
                { label: 'Schedules', icon: 'pi pi-fw pi-calendar', routerLink: ['/ticket/schedules'] },
                { label: 'Selling Options', icon: 'pi pi-fw pi-search', routerLink: ['/ticket/selling-options'] },
                { label: 'Stations', icon: 'pi pi-fw pi-building', routerLink: ['/ticket/stations'] },
                { label: 'Tariffs', icon: 'pi pi-fw pi-money-bill', routerLink: ['/ticket/tariffs'] }
            ]
        },
        {
            label: 'Finance',
            items: [
                { label: 'Sales Parties', icon: 'pi pi-fw pi-users', routerLink: ['/ticket/sales-parties'] },
                { label: 'Cash Inventory', icon: 'pi pi-fw pi-wallet', routerLink: ['/ticket/cash-inventory'] }
            ]
        },
        {
            label: 'Settings',
            items: [
                { label: 'Users', icon: 'pi pi-fw pi-users', routerLink: ['/ticket/users'] },
                { label: 'Payments', icon: 'pi pi-fw pi-cog', routerLink: ['/ticket/settings/payments'] }
            ]
        }
    ];
}
