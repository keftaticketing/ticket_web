import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { ReportsDashboard } from './app/pages/ticket/reports/reports-dashboard';
import { adminGuard } from './app/core/guards/admin.guard';
import { authGuard } from './app/core/guards/auth.guard';
import { mustChangePasswordGuard } from './app/core/guards/must-change-password.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard, mustChangePasswordGuard, adminGuard],
        children: [
            { path: '', component: ReportsDashboard },
            { path: 'ticket', loadChildren: () => import('./app/pages/ticket/ticket.routes') }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
