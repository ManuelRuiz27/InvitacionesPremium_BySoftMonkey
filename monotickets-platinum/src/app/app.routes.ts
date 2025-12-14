import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    {
        path: 'events',
        children: [
            {
                path: '',
                redirectTo: '/dashboard',
                pathMatch: 'full'
            },
            {
                path: 'create',
                loadComponent: () => import('./pages/events/create-event/create-event.component')
                    .then(m => m.CreateEventComponent)
            },
            {
                path: ':id/import',
                loadComponent: () => import('./pages/events/import-guests/import-guests.component')
                    .then(m => m.ImportGuestsComponent)
            },
            {
                path: ':id/delivery',
                loadComponent: () => import('./pages/events/delivery-panel/delivery-panel.component')
                    .then(m => m.DeliveryPanelComponent)
            },
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
