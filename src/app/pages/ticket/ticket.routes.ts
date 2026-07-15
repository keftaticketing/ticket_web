import { Routes } from '@angular/router';
import { adminGuard } from '@/app/core/guards/admin.guard';
import { Associations } from '@/app/pages/ticket/associations/associations';
import { Buses } from '@/app/pages/ticket/buses/buses';
import { BusLevels } from '@/app/pages/ticket/bus-levels/bus-levels';
import { BusTypes } from '@/app/pages/ticket/bus-types/bus-types';
import { CashInventoryPage } from '@/app/pages/ticket/cash-inventory/cash-inventory';
import { Cities } from '@/app/pages/ticket/cities/cities';
import { PaymentSettingsPage } from '@/app/pages/ticket/settings/payment-settings';
import { ReportsDashboard } from '@/app/pages/ticket/reports/reports-dashboard';
import { RoutesPage } from '@/app/pages/ticket/routes/routes-page';
import { SalesParties } from '@/app/pages/ticket/sales-parties/sales-parties';
import { Schedules } from '@/app/pages/ticket/schedules/schedules';
import { SellingOptions } from '@/app/pages/ticket/selling-options/selling-options';
import { Stations } from '@/app/pages/ticket/stations/stations';
import { Tariffs } from '@/app/pages/ticket/tariffs/tariffs';
import { Tickets } from '@/app/pages/ticket/tickets/tickets';
import { Users } from '@/app/pages/ticket/users/users';

export default [
    { path: 'associations', component: Associations, canActivate: [adminGuard] },
    { path: 'buses', component: Buses, canActivate: [adminGuard] },
    { path: 'bus-levels', component: BusLevels, canActivate: [adminGuard] },
    { path: 'bus-types', component: BusTypes, canActivate: [adminGuard] },
    { path: 'cities', component: Cities, canActivate: [adminGuard] },
    { path: 'routes', component: RoutesPage, canActivate: [adminGuard] },
    { path: 'schedules', component: Schedules, canActivate: [adminGuard] },
    { path: 'selling-options', component: SellingOptions, canActivate: [adminGuard] },
    { path: 'stations', component: Stations, canActivate: [adminGuard] },
    { path: 'tariffs', component: Tariffs, canActivate: [adminGuard] },
    { path: 'tickets', component: Tickets, canActivate: [adminGuard] },
    { path: 'sales-parties', component: SalesParties, canActivate: [adminGuard] },
    { path: 'cash-inventory', component: CashInventoryPage, canActivate: [adminGuard] },
    { path: 'settings/payments', component: PaymentSettingsPage, canActivate: [adminGuard] },
    { path: 'users', component: Users, canActivate: [adminGuard] },
    { path: 'reports', component: ReportsDashboard, canActivate: [adminGuard] }
] as Routes;
