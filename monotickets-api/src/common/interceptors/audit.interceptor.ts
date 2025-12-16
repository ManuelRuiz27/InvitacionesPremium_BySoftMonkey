import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Actions that should be audited
 */
const AUDITABLE_ACTIONS = [
    'publish',
    'send',
    'scan',
    'rsvp',
    'block',
    'close',
    'anonymize',
    'delete',
];

/**
 * Interceptor to log critical actions to ComplianceLog
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user } = request;

        // Extract action from URL (e.g., /events/:id/publish -> publish)
        const action = this.extractAction(url, method);

        if (!action || !AUDITABLE_ACTIONS.includes(action)) {
            return next.handle();
        }

        return next.handle().pipe(
            tap(async () => {
                try {
                    // Log the action
                    await this.logAction(action, request, user);
                } catch (error) {
                    // Don't fail the request if logging fails
                    console.error('Audit logging failed:', error);
                }
            }),
        );
    }

    private extractAction(url: string, method: string): string | null {
        // Extract action from URL patterns
        const patterns = [
            { regex: /\/events\/[^/]+\/publish/, action: 'publish' },
            { regex: /\/events\/[^/]+\/block/, action: 'block' },
            { regex: /\/events\/[^/]+\/close/, action: 'close' },
            { regex: /\/invitations\/[^/]+\/send/, action: 'send' },
            { regex: /\/scanner\/scan/, action: 'scan' },
            { regex: /\/rsvp/, action: 'rsvp' },
        ];

        for (const pattern of patterns) {
            if (pattern.regex.test(url)) {
                return pattern.action;
            }
        }

        return null;
    }

    private async logAction(action: string, request: any, user: any) {
        const entityId = request.params.id || request.params.eventId || request.body?.id;
        const entityType = this.determineEntityType(request.url);

        await this.prisma.complianceLog.create({
            data: {
                action: action.toUpperCase(),
                entityType,
                entityId: entityId || 'unknown',
                performedBy: user?.id || null,
            },
        });
    }

    private determineEntityType(url: string): string {
        if (url.includes('/events')) return 'EVENT';
        if (url.includes('/invitations')) return 'INVITATION';
        if (url.includes('/guests')) return 'GUEST';
        if (url.includes('/scanner')) return 'SCAN';
        return 'UNKNOWN';
    }
}
