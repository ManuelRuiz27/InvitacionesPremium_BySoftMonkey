import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SendBatchRequest {
    invitationIds: string[];
    method?: 'SMS' | 'WHATSAPP' | 'EMAIL';
    message?: string;
}

export interface BatchResponse {
    batchId: string;
    message: string;
    count: number;
    method: string;
    status: string;
    stats: {
        total: number;
        sent: number;
        failed: number;
        pending: number;
    };
    invitations: Array<{
        invitationId: string;
        qrToken: string;
        status: string;
        method: string;
        attempts: number;
    }>;
}

export interface BatchStatus {
    batchId: string;
    status: string;
    totalInvitations: number;
    sentSuccessfully: number;
    failed: number;
    pending: number;
    createdAt: Date;
    completedAt: Date;
    method: string;
}

export interface RetryResponse {
    message: string;
    invitationId: string;
    status: string;
    method: string;
    attempts: number;
}

@Injectable({
    providedIn: 'root',
})
export class DeliveryService {
    private readonly apiUrl = `${environment.apiUrl}/delivery`;

    constructor(private http: HttpClient) { }

    sendBatch(request: SendBatchRequest): Observable<BatchResponse> {
        return this.http.post<BatchResponse>(`${this.apiUrl}/send`, request);
    }

    getBatchStatus(batchId: string): Observable<BatchStatus> {
        return this.http.get<BatchStatus>(`${this.apiUrl}/status/${batchId}`);
    }

    retryDelivery(invitationId: string): Observable<RetryResponse> {
        return this.http.post<RetryResponse>(
            `${this.apiUrl}/retry/${invitationId}`,
            {}
        );
    }
}
