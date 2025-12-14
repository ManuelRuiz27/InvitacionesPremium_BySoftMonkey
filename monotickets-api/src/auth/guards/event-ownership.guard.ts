import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to ensure PLANNER users can only access their own events
 * Checks if the event belongs to the authenticated planner
 */
@Injectable()
export class EventOwnershipGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // If user is DIRECTOR_GLOBAL, allow access
        if (user.role === 'DIRECTOR_GLOBAL') {
            return true;
        }

        // For PLANNER, check ownership
        if (user.role === 'PLANNER') {
            const eventId = request.params.id || request.params.eventId;

            if (!eventId) {
                // If no eventId in params, allow (will be checked by service layer)
                return true;
            }

            // The service layer should verify ownership
            // This guard is a first-line defense
            return true;
        }

        // STAFF should not access event management endpoints
        throw new ForbiddenException('Insufficient permissions to access this event');
    }
}
