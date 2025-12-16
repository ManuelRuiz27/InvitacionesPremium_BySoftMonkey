import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user-role.enum'; // Assuming this exists or is imported correctly

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
            }
        ]
    },
    // Guest Landing Routes
    {
        path: 'i/:inviteCode',
        loadComponent: () => import('./features/guest/invitation-landing/invitation-landing').then(m => m.InvitationLanding)
    },
    {
        path: 'i/:inviteCode/rsvp',
        loadComponent: () => import('./features/guest/rsvp-form/rsvp-form').then(m => m.RsvpForm)
    },
    {
        path: 'i/:inviteCode/qr',
        loadComponent: () => import('./features/guest/qr-display/qr-display').then(m => m.QrDisplay)
    },
    // Staff Routes
    {
        path: 'staff',
        canActivate: [authGuard, roleGuard([UserRole.STAFF])],
        children: [
            {
                path: 'scanner',
                loadComponent: () => import('./features/staff/scanner/scanner.component').then(m => m.ScannerComponent)
            },
            {
                path: 'scan-history',
                loadComponent: () => import('./features/staff/scan-history/scan-history.component').then(m => m.ScanHistoryComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
