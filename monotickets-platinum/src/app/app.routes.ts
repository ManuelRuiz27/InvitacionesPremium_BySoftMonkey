import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
            }
        ]
    },
    {
        path: 'director',
        canActivate: [authGuard, roleGuard([UserRole.DIRECTOR_GLOBAL])],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/director-global/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'planners',
                loadComponent: () => import('./features/director-global/planners-list/planners-list').then(m => m.PlannersList)
            },
            {
                path: 'planners/:id',
                loadComponent: () => import('./features/director-global/planner-detail/planner-detail').then(m => m.PlannerDetail)
            },
            {
                path: 'events',
                loadComponent: () => import('./features/director-global/events-list/events-list').then(m => m.EventsList)
            }
        ]
    },
    {
        path: 'planner',
        canActivate: [authGuard, roleGuard([UserRole.PLANNER])],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/planner/dashboard/dashboard').then(m => m.PlannerDashboard)
            },
            {
                path: 'events',
                loadComponent: () => import('./features/planner/events-list/events-list').then(m => m.EventsList)
            },
            {
                path: 'events/new',
                loadComponent: () => import('./features/planner/event-form/event-form').then(m => m.EventForm)
            },
            {
                path: 'events/:id',
                loadComponent: () => import('./features/planner/event-detail/event-detail').then(m => m.EventDetail)
            },
            {
                path: 'events/:id/edit',
                loadComponent: () => import('./features/planner/event-form/event-form').then(m => m.EventForm)
            },
            {
                path: 'events/:eventId/guests',
                loadComponent: () => import('./features/planner/guests-list/guests-list').then(m => m.GuestsList)
            },
            {
                path: 'events/:eventId/guests/upload',
                loadComponent: () => import('./features/planner/guests-upload/guests-upload').then(m => m.GuestsUpload)
            },
            {
                path: 'events/:eventId/guests/new',
                loadComponent: () => import('./features/planner/guest-form/guest-form').then(m => m.GuestForm)
            },
            {
                path: 'events/:eventId/guests/:guestId/edit',
                loadComponent: () => import('./features/planner/guest-form/guest-form').then(m => m.GuestForm)
            },
            {
                path: 'events/:eventId/invitations',
                loadComponent: () => import('./features/planner/invitations-list/invitations-list').then(m => m.InvitationsList)
            },
            {
                path: 'events/:eventId/invitations/generate',
                loadComponent: () => import('./features/planner/invitations-generator/invitations-generator').then(m => m.InvitationsGenerator)
            },
            {
                path: 'events/:eventId/scans',
                loadComponent: () => import('./features/planner/scans-panel/scans-panel').then(m => m.ScansPanel)
            },
            {
                path: 'events/:eventId/rsvp-generator',
                loadComponent: () => import('./features/planner/rsvp-generator/rsvp-generator').then(m => m.RsvpGenerator)
            },
            {
                path: 'events/:eventId/host-links',
                loadComponent: () => import('./features/planner/host-link-generator/host-link-generator').then(m => m.HostLinkGenerator)
            }
        ]
    },
    {
        path: 'staff',
        canActivate: [authGuard, roleGuard([UserRole.STAFF])],
        children: [
            {
                path: 'scanner',
                loadComponent: () => import('./features/staff/scanner/scanner').then(m => m.Scanner)
            }
        ]
    },
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
        redirectTo: '/auth/login'
    }
];
