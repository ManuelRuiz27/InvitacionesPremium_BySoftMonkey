import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MockDataService } from '../../../core/services/mock-data.service';
import { InvitationStatus } from '../../../core/models';

// Interfaces
export interface DeliveryAttempt {
    id: string;
    invitationId: string;
    guestId: string;
    guestName: string;
    phone: string;
    channel: 'SMS' | 'WHATSAPP';
    status: 'PENDING' | 'SENT' | 'FAILED';
    providerMessageId?: string;
    errorCode?: string;
    errorMessage?: string;
    sentAt?: string;
    createdAt: string;
}

export interface DeliveryStats {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    successRate: number;
}

export interface SendInvitationsRequest {
    invitationIds: string[];
    channel?: 'SMS' | 'WHATSAPP' | 'BOTH';
}

@Injectable({
    providedIn: 'root'
})
export class DeliveryService {
    private apiUrl = `${environment.apiUrl}/delivery`;
    private useMockData = true; // Cambiar a false cuando backend esté listo

    constructor(
        private http: HttpClient,
        private mockDataService: MockDataService
    ) { }

    /**
     * Enviar invitaciones
     */
    sendInvitations(eventId: string, request: SendInvitationsRequest): Observable<{ message: string; attempts: DeliveryAttempt[] }> {
        if (this.useMockData) {
            return this.mockSendInvitations(eventId, request).pipe(
                tap(result => {
                    // Actualizar estado de invitaciones en MockDataService
                    result.attempts.forEach(attempt => {
                        if (attempt.status === 'SENT') {
                            this.mockDataService.updateInvitationStatus(
                                attempt.invitationId,
                                InvitationStatus.SENT,
                                new Date(attempt.sentAt!)
                            );
                        }
                    });
                })
            );
        }
        return this.http.post<{ message: string; attempts: DeliveryAttempt[] }>(
            `${this.apiUrl}/send/${eventId}`,
            request
        );
    }

    /**
     * Obtener intentos de entrega por evento
     */
    getDeliveryAttempts(eventId: string): Observable<DeliveryAttempt[]> {
        if (this.useMockData) {
            return this.getMockDeliveryAttempts(eventId);
        }
        return this.http.get<DeliveryAttempt[]>(`${this.apiUrl}/attempts/${eventId}`);
    }

    /**
     * Reintentar envío fallido
     */
    retryDelivery(attemptId: string): Observable<DeliveryAttempt> {
        if (this.useMockData) {
            return this.mockRetryDelivery(attemptId);
        }
        return this.http.post<DeliveryAttempt>(`${this.apiUrl}/retry/${attemptId}`, {});
    }

    /**
     * Obtener estadísticas de delivery
     */
    getDeliveryStats(eventId: string): Observable<DeliveryStats> {
        if (this.useMockData) {
            return this.getMockDeliveryStats(eventId);
        }
        return this.http.get<DeliveryStats>(`${this.apiUrl}/stats/${eventId}`);
    }

    // ========== MOCK DATA METHODS ==========

    private mockSendInvitations(eventId: string, request: SendInvitationsRequest): Observable<{ message: string; attempts: DeliveryAttempt[] }> {
        const attempts: DeliveryAttempt[] = request.invitationIds.map((invId, index) => ({
            id: `attempt-${Date.now()}-${index}`,
            invitationId: invId,
            guestId: `guest-${index}`,
            guestName: `Invitado ${index + 1}`,
            phone: `+52 55 ${1000 + index} ${2000 + index}`,
            channel: request.channel === 'BOTH' ? (Math.random() > 0.5 ? 'SMS' : 'WHATSAPP') : (request.channel || 'SMS'),
            status: Math.random() > 0.1 ? 'SENT' : 'FAILED',
            providerMessageId: Math.random() > 0.1 ? `msg-${Date.now()}-${index}` : undefined,
            errorCode: Math.random() > 0.9 ? 'INVALID_NUMBER' : undefined,
            errorMessage: Math.random() > 0.9 ? 'Número inválido' : undefined,
            sentAt: Math.random() > 0.1 ? new Date().toISOString() : undefined,
            createdAt: new Date().toISOString()
        }));

        return of({
            message: `${attempts.length} invitaciones enviadas`,
            attempts
        });
    }

    private getMockDeliveryAttempts(eventId: string): Observable<DeliveryAttempt[]> {
        const attempts: DeliveryAttempt[] = [
            {
                id: 'attempt-1',
                invitationId: 'inv-001',
                guestId: 'guest-001',
                guestName: 'María García',
                phone: '+52 55 1234 5678',
                channel: 'SMS',
                status: 'SENT',
                providerMessageId: 'msg-001',
                sentAt: '2025-12-02T10:30:00Z',
                createdAt: '2025-12-02T10:29:00Z'
            },
            {
                id: 'attempt-2',
                invitationId: 'inv-002',
                guestId: 'guest-002',
                guestName: 'Juan Pérez',
                phone: '+52 55 9876 5432',
                channel: 'WHATSAPP',
                status: 'SENT',
                providerMessageId: 'msg-002',
                sentAt: '2025-12-02T10:31:00Z',
                createdAt: '2025-12-02T10:30:00Z'
            },
            {
                id: 'attempt-3',
                invitationId: 'inv-003',
                guestId: 'guest-003',
                guestName: 'Ana López',
                phone: '+52 55 5555 5555',
                channel: 'SMS',
                status: 'FAILED',
                errorCode: 'INVALID_NUMBER',
                errorMessage: 'Número inválido',
                createdAt: '2025-12-02T10:32:00Z'
            },
            {
                id: 'attempt-4',
                invitationId: 'inv-004',
                guestId: 'guest-004',
                guestName: 'Carlos Rodríguez',
                phone: '+52 55 1111 2222',
                channel: 'WHATSAPP',
                status: 'PENDING',
                createdAt: '2025-12-02T10:33:00Z'
            }
        ];

        return of(attempts);
    }

    private mockRetryDelivery(attemptId: string): Observable<DeliveryAttempt> {
        const attempt: DeliveryAttempt = {
            id: attemptId,
            invitationId: 'inv-003',
            guestId: 'guest-003',
            guestName: 'Ana López',
            phone: '+52 55 5555 5555',
            channel: 'WHATSAPP',
            status: 'SENT',
            providerMessageId: `msg-retry-${Date.now()}`,
            sentAt: new Date().toISOString(),
            createdAt: '2025-12-02T10:32:00Z'
        };

        return of(attempt);
    }

    private getMockDeliveryStats(eventId: string): Observable<DeliveryStats> {
        const stats: DeliveryStats = {
            total: 4,
            pending: 1,
            sent: 2,
            failed: 1,
            successRate: 50
        };

        return of(stats);
    }
}
