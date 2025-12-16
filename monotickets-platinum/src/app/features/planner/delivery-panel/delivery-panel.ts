import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  DeliveryAttempt,
  DeliveryChannelBreakdown,
  DeliveryHistoryPoint,
  DeliveryService,
  DeliveryStats,
  SendInvitationsRequest
} from '../services/delivery.service';

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
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    DatePipe
  ],
  templateUrl: './delivery-panel.html',
  styleUrl: './delivery-panel.scss'
})
export class DeliveryPanel implements OnInit, OnDestroy {
  statsLoading = true;
  attemptsLoading = true;
  sending = false;
  selectedMethod: 'SMS' | 'WHATSAPP' = 'WHATSAPP';
  displayedColumns: string[] = ['guest', 'method', 'status', 'attempts', 'actions'];
  attempts: DeliveryAttempt[] = [];
  stats: DeliveryStats = { total: 0, pending: 0, sent: 0, failed: 0, successRate: 0 };
  channelBreakdown: DeliveryChannelBreakdown[] = [];
  history: DeliveryHistoryPoint[] = [];
  lastUpdated?: Date;
  failureRate = 0;
  failureAlertActive = false;
  refreshCountdown = 15;
  readonly autoRefreshSeconds = 15;

  private readonly destroy$ = new Subject<void>();
  private hasShownFailureSnack = false;
  private retryingIds = new Set<string>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { eventId: string; invitationIds: string[] },
    private dialogRef: MatDialogRef<DeliveryPanel>,
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.refreshAll();
    this.startAutoRefreshTicker();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshAll(silent = false): void {
    this.refreshCountdown = this.autoRefreshSeconds;
    this.loadStats(silent);
    this.loadAttempts(silent);
  }

  loadStats(silent = false): void {
    if (!silent) {
      this.statsLoading = true;
    }
    this.deliveryService.getDeliveryStats(this.data.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.channelBreakdown = this.ensureChannelBreakdown(stats.byChannel);
          this.history = (stats.history ?? []).slice(-5).reverse();
          this.failureRate = stats.failureRate ?? this.computeFailureRate(stats);
          this.failureAlertActive = this.failureRate > 10;
          if (this.failureAlertActive && !this.hasShownFailureSnack) {
            this.showSnack('Detectamos más del 10% de fallas en tus envíos. Revisa la lista antes de continuar.');
            this.hasShownFailureSnack = true;
          } else if (!this.failureAlertActive) {
            this.hasShownFailureSnack = false;
          }
          this.lastUpdated = stats.updatedAt ? new Date(stats.updatedAt) : new Date();
          this.statsLoading = false;
        },
        error: () => {
          this.statsLoading = false;
          this.showSnack('No se pudieron cargar las métricas de delivery');
        }
      });
  }

  loadAttempts(silent = false): void {
    if (!silent) {
      this.attemptsLoading = true;
    }
    this.deliveryService.getDeliveryAttempts(this.data.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attempts) => {
          this.attempts = attempts;
          this.attemptsLoading = false;
        },
        error: () => {
          this.attemptsLoading = false;
          this.showSnack('No se pudieron cargar los envíos anteriores');
        }
      });
  }

  sendInvitations(): void {
    if (this.isSelectionEmpty) {
      this.showSnack('Selecciona al menos una invitación');
      return;
    }
    if (this.sending) {
      return;
    }

    this.sending = true;
    const payload: SendInvitationsRequest = {
      invitationIds: this.data.invitationIds,
      channel: this.selectedMethod
    };

    this.deliveryService.sendInvitations(this.data.eventId, payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.sending = false;
        this.showSnack(response.message);
        this.refreshAll(true);
      },
      error: (err) => {
        console.error('Error sending invitations:', err);
        this.sending = false;
        this.showSnack('Error al enviar invitaciones');
      }
    });
  }

  retryDelivery(invitationId: string): void {
    if (this.retryingIds.has(invitationId)) {
      return;
    }
    this.retryingIds.add(invitationId);
    this.deliveryService.retryDelivery(invitationId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showSnack('Reintento enviado');
        this.retryingIds.delete(invitationId);
        this.refreshAll(true);
      },
      error: (err) => {
        console.error('Error retrying delivery:', err);
        this.showSnack('Error al reintentar el envío');
        this.retryingIds.delete(invitationId);
      }
    });
  }

  getMethodIcon(method: string): string {
    switch (method?.toUpperCase()) {
      case 'SMS': return 'sms';
      case 'WHATSAPP': return 'chat';
      default: return 'send';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SENT': return 'success';
      case 'FAILED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SENT': return 'check_circle';
      case 'FAILED': return 'error';
      case 'PENDING': return 'schedule';
      default: return 'help';
    }
  }

  get isSelectionEmpty(): boolean {
    return !this.data.invitationIds || this.data.invitationIds.length === 0;
  }

  get failureRateLabel(): string {
    return `${this.failureRate.toFixed(1)}%`;
  }

  get hasAttempts(): boolean {
    return this.attempts.length > 0;
  }

  get refreshLabel(): string {
    return this.refreshCountdown > 0
      ? `Actualización automática en ${this.refreshCountdown}s`
      : 'Actualizando...';
  }

  isRetrying(invitationId: string): boolean {
    return this.retryingIds.has(invitationId);
  }

  getLastUpdatedCopy(): string {
    if (!this.lastUpdated) {
      return 'nunca';
    }
    const diffSeconds = Math.round((Date.now() - this.lastUpdated.getTime()) / 1000);
    if (diffSeconds < 5) {
      return 'hace unos segundos';
    }
    if (diffSeconds < 60) {
      return `hace ${diffSeconds}s`;
    }
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `hace ${diffMinutes} min`;
    }
    const diffHours = Math.round(diffMinutes / 60);
    return `hace ${diffHours}h`;
  }

  trackByAttempt(_index: number, attempt: DeliveryAttempt): string {
    return attempt.id || attempt.invitationId;
  }

  close(result?: boolean): void {
    this.dialogRef.close(result);
  }

  private startAutoRefreshTicker(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.refreshCountdown <= 0) {
          this.refreshAll(true);
        } else {
          this.refreshCountdown -= 1;
        }
      });
  }

  private ensureChannelBreakdown(data?: DeliveryChannelBreakdown[]): DeliveryChannelBreakdown[] {
    if (data && data.length) {
      return data;
    }
    return [
      { channel: 'WHATSAPP', sent: 0, failed: 0, pending: 0 },
      { channel: 'SMS', sent: 0, failed: 0, pending: 0 }
    ];
  }

  private computeFailureRate(stats: DeliveryStats): number {
    if (!stats.total) {
      return 0;
    }
    return (stats.failed / stats.total) * 100;
  }

  private showSnack(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3500 });
  }
}
