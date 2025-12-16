import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

export interface DeliveryChannelBreakdown {
    channel: 'SMS' | 'WHATSAPP';
    sent: number;
    failed: number;
    pending: number;
}

export interface DeliveryHistoryPoint {
    timestamp: string;
    sent: number;
    failed: number;
}

export interface DeliveryStats {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    successRate: number;
    failureRate?: number;
    updatedAt?: string;
    byChannel?: DeliveryChannelBreakdown[];
    history?: DeliveryHistoryPoint[];
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

    constructor(private http: HttpClient) { }

    sendInvitations(eventId: string, request: SendInvitationsRequest): Observable<{ message: string; attempts: DeliveryAttempt[] }> {
        return this.http.post<{ message: string; attempts: DeliveryAttempt[] }>(
            `${this.apiUrl}/send/${eventId}`,
            request
        );
    }

    getDeliveryAttempts(eventId: string): Observable<DeliveryAttempt[]> {
        return this.http.get<DeliveryAttempt[]>(`${this.apiUrl}/attempts/${eventId}`);
    }

    retryDelivery(attemptId: string): Observable<DeliveryAttempt> {
        return this.http.post<DeliveryAttempt>(`${this.apiUrl}/retry/${attemptId}`, {});
    }

    getDeliveryStats(eventId: string): Observable<DeliveryStats> {
        return this.http.get<DeliveryStats>(`${this.apiUrl}/stats/${eventId}`);
    }
}
