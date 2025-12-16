import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { EventsService } from '../../../core/services/events.service';
import { DeliveryService, DeliverySummary } from '../../../core/services/delivery.service';

interface InvitationRow {
    id: string;
    guestName: string;
    phone: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'invalid';
    sentAt: Date | null;
    deliveredAt: Date | null;
    smsStatus: 'success' | 'failed' | 'pending' | null;
    whatsappStatus: 'success' | 'failed' | 'pending' | null;
}

@Component({
    selector: 'app-delivery-panel',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatTableModule,
        MatChipsModule,
        MatIconModule,
        MatProgressBarModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './delivery-panel.component.html',
    styleUrls: ['./delivery-panel.component.css']
})
export class DeliveryPanelComponent implements OnInit, OnDestroy {
    eventId: string = '';
    invitations: InvitationRow[] = [];
    summary: DeliverySummary | null = null;
    isLoading = true;
    isSending = false;
    activeFilter: 'all' | 'sent' | 'delivered' | 'failed' | 'pending' = 'all';

    displayedColumns: string[] = ['select', 'guestName', 'phone', 'status', 'channels', 'actions'];
    selection = new SelectionModel<InvitationRow>(true, []);

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private eventsService: EventsService,
        private deliveryService: DeliveryService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('id') || '';
        this.loadData();
        this.setupAutoRefresh();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    setupAutoRefresh(): void {
        // Auto-refresh every 10 seconds when sending
        interval(10000)
            .pipe(
                startWith(0),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                if (this.isSending) {
                    this.loadData();
                }
            });
    }

    loadData(): void {
        this.isLoading = true;

        // Load summary
        this.deliveryService.getDeliverySummary(this.eventId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (summary) => {
                    this.summary = summary;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading summary:', error);
                    this.isLoading = false;
                }
            });

        // TODO: Load invitations list
        // For now using mock data
        this.invitations = [];
    }

    sendBulk(): void {
        const selectedIds = this.selection.selected.map(inv => inv.id);

        if (selectedIds.length === 0) {
            this.snackBar.open('Selecciona al menos una invitación', 'Cerrar', { duration: 3000 });
            return;
        }

        this.isSending = true;
        this.deliveryService.sendBulk(this.eventId, { invitationIds: selectedIds })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.snackBar.open(
                        `✓ Enviando ${selectedIds.length} invitaciones...`,
                        'Cerrar',
                        { duration: 5000 }
                    );
                    this.selection.clear();
                    this.loadData();
                },
                error: (error) => {
                    console.error('Error sending invitations:', error);
                    this.isSending = false;
                    this.snackBar.open('Error al enviar invitaciones', 'Cerrar', { duration: 5000 });
                }
            });
    }

    retrySingle(invitation: InvitationRow): void {
        this.deliveryService.sendInvitation(invitation.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.snackBar.open('Reintentando envío...', 'Cerrar', { duration: 3000 });
                    setTimeout(() => this.loadData(), 2000);
                },
                error: (error) => {
                    console.error('Error retrying:', error);
                    this.snackBar.open('Error al reintentar', 'Cerrar', { duration: 3000 });
                }
            });
    }

    setFilter(filter: 'all' | 'sent' | 'delivered' | 'failed' | 'pending'): void {
        this.activeFilter = filter;
    }

    get filteredInvitations(): InvitationRow[] {
        if (this.activeFilter === 'all') {
            return this.invitations;
        }
        return this.invitations.filter(inv => inv.status === this.activeFilter);
    }

    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        const numRows = this.filteredInvitations.length;
        return numSelected === numRows;
    }

    toggleAllRows(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.filteredInvitations.forEach(row => this.selection.select(row));
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'delivered':
                return 'bg-green-100';
            case 'sent':
                return 'bg-blue-100';
            case 'failed':
                return 'bg-red-100';
            case 'invalid':
                return 'bg-yellow-100';
            default:
                return 'bg-gray-100';
        }
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            pending: 'Pendiente',
            sent: 'Enviado',
            delivered: 'Entregado',
            failed: 'Fallido',
            invalid: 'Número Inválido',
        };
        return labels[status] || status;
    }

    get deliveryRate(): number {
        if (!this.summary || this.summary.total === 0) return 0;
        return (this.summary.delivered / this.summary.total) * 100;
    }
}
