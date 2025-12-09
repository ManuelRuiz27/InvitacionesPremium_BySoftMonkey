import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { DeliveryService, type BatchResponse } from '../../../core/services/delivery.service';

interface DeliveryAttemptDisplay {
    invitationId: string;
    qrToken: string;
    status: string;
    method: string;
    attempts: number;
}

@Component({
    selector: 'app-delivery-panel',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatTooltipModule,
        MatSelectModule
    ],
    templateUrl: './delivery-panel.html',
    styleUrl: './delivery-panel.scss'
})
export class DeliveryPanel implements OnInit {
    loading = false;
    sending = false;
    lastBatchResponse: BatchResponse | null = null;
    selectedMethod: 'SMS' | 'WHATSAPP' | 'EMAIL' = 'WHATSAPP'; // Default to WhatsApp (more economical)
    displayedColumns: string[] = ['qrToken', 'method', 'status', 'attempts', 'actions'];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { eventId: string; invitationIds: string[] },
        private dialogRef: MatDialogRef<DeliveryPanel>,
        private deliveryService: DeliveryService
    ) { }

    ngOnInit(): void {
        // No need to load data initially, will load after sending
    }

    get stats() {
        return this.lastBatchResponse?.stats || {
            total: 0,
            sent: 0,
            failed: 0,
            pending: 0
        };
    }

    get attempts(): DeliveryAttemptDisplay[] {
        return this.lastBatchResponse?.invitations || [];
    }

    sendInvitations(): void {
        this.sending = true;

        this.deliveryService.sendBatch({
            invitationIds: this.data.invitationIds,
            method: this.selectedMethod
        }).subscribe({
            next: (response) => {
                this.sending = false;
                this.lastBatchResponse = response;
                alert(`✅ ${response.message}\n\nEnviados: ${response.stats.sent}\nFallidos: ${response.stats.failed}`);
            },
            error: (err) => {
                console.error('Error sending invitations:', err);
                this.sending = false;
                alert('❌ Error al enviar invitaciones');
            }
        });
    }

    retryDelivery(invitationId: string): void {
        this.deliveryService.retryDelivery(invitationId).subscribe({
            next: (response) => {
                alert(`✅ ${response.message}\nEstado: ${response.status}\nMétodo: ${response.method}`);
                // Refresh by sending again
                this.sendInvitations();
            },
            error: (err) => {
                console.error('Error retrying delivery:', err);
                alert('❌ Error al reintentar');
            }
        });
    }

    getStatusColor(status: string): string {
        switch (status.toUpperCase()) {
            case 'SENT': return 'success';
            case 'FAILED': return 'error';
            case 'PENDING': return 'warning';
            default: return 'default';
        }
    }

    getStatusIcon(status: string): string {
        switch (status.toUpperCase()) {
            case 'SENT': return 'check_circle';
            case 'FAILED': return 'error';
            case 'PENDING': return 'schedule';
            default: return 'help';
        }
    }

    getMethodIcon(method: string): string {
        switch (method.toUpperCase()) {
            case 'SMS': return 'sms';
            case 'WHATSAPP': return 'chat';
            case 'EMAIL': return 'email';
            default: return 'send';
        }
    }

    close(result?: boolean): void {
        this.dialogRef.close(result);
    }
}
