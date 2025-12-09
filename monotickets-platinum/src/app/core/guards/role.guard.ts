import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        if (!authService.isAuthenticated) {
            router.navigate(['/auth/login']);
            return false;
        }

        if (authService.hasAnyRole(allowedRoles)) {
            return true;
        }

        // Redirect to appropriate dashboard based on user role
        const userRole = authService.userRole;
        switch (userRole) {
            case UserRole.DIRECTOR_GLOBAL:
                router.navigate(['/director/dashboard']);
                break;
            case UserRole.PLANNER:
                router.navigate(['/planner/dashboard']);
                break;
            case UserRole.STAFF:
                router.navigate(['/staff/scanner']);
                break;
            default:
                router.navigate(['/auth/login']);
        }

        return false;
    };
};
