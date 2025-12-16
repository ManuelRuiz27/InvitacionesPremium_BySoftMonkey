import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { forkJoin } from 'rxjs';

import {
  PlannerService,
  EventStats,
  EventMetricsSummary
} from '../services/planner.service';
import { type Event } from '../../../core/models';

type RateKey = 'deliveryRate' | 'rsvpRate' | 'showUpRate';

@Component({
  selector: 'app-event-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './event-metrics.html',
  styleUrl: './event-metrics.scss'
})
export class EventMetrics implements OnInit {
  eventId = '';
  event: Event | null = null;
  stats: EventStats | null = null;
  metrics: EventMetricsSummary | null = null;

  loading = true;
  error: string | null = null;
  alerts: string[] = [];

  readonly rateCards: Array<{
    key: RateKey;
    label: string;
    description: string;
    icon: string;
  }> = [
      {
        key: 'deliveryRate',
        label: 'Delivery success',
        description: 'Invitaciones entregadas / generadas',
        icon: 'outbox'
      },
      {
        key: 'rsvpRate',
        label: 'RSVP rate',
        description: 'Respuestas confirmadas o declinadas',
        icon: 'how_to_reg'
      },
      {
        key: 'showUpRate',
        label: 'Asistencia real',
        description: 'Invitados que llegaron vs confirmados',
        icon: 'groups'
      }
    ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private plannerService: PlannerService
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    if (!this.eventId) {
      this.error = 'Evento no encontrado';
      this.loading = false;
      return;
    }
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      event: this.plannerService.getEventById(this.eventId),
      stats: this.plannerService.getEventStats(this.eventId),
      metrics: this.plannerService.getEventMetrics(this.eventId)
    }).subscribe({
      next: ({ event, stats, metrics }) => {
        this.event = event;
        this.stats = stats;
        this.metrics = metrics;
        this.updateAlerts();
        this.loading = false;
      },
      error: (err) => {
        console.error('No se pudieron cargar las métricas', err);
        this.error = 'No se pudieron cargar las métricas del evento.';
        this.loading = false;
      }
    });
  }

  private updateAlerts(): void {
    if (!this.metrics) {
      this.alerts = [];
      return;
    }

    const alerts: string[] = [];
    if (this.metrics.deliveryRate < 90) {
      alerts.push('Menos del 90% de las invitaciones se entregaron. Revisa el panel de envíos.');
    }
    if (this.metrics.rsvpRate < 70) {
      alerts.push('El RSVP rate es bajo. Considera enviar recordatorios personalizados.');
    }
    if (this.metrics.showUpRate < 80 && this.metrics.expectedTotal > 0) {
      alerts.push('La asistencia confirmada no se está reflejando en accesos. Coordina con el staff.');
    }
    if ((this.stats?.pending ?? 0) > (this.stats?.confirmations ?? 0)) {
      alerts.push('Hay más invitaciones pendientes que confirmadas. Prioriza seguimiento.');
    }
    if (this.metrics.avgTimeToRsvp > 5) {
      alerts.push('Los invitados tardan más de 5 días en responder. Ajusta el copy o comparte de nuevo el RSVP.');
    }

    this.alerts = alerts;
  }

  getRateValue(key: RateKey): number {
    if (!this.metrics) return 0;
    return Number((this.metrics[key] ?? 0).toFixed(1));
  }

  getRateClass(rate: number): string {
    if (rate >= 90) {
      return 'rate-good';
    }
    if (rate >= 75) {
      return 'rate-warning';
    }
    return 'rate-bad';
  }

  formatEventDate(): string {
    if (!this.event) {
      return '';
    }
    const date = new Date(this.event.date);
    const time = this.event.time ? ` • ${this.event.time}` : '';
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }) + time;
  }

  get attendanceProgress(): number {
    if (!this.metrics || this.metrics.expectedTotal === 0) {
      return 0;
    }
    const value = (this.metrics.totalEntered / this.metrics.expectedTotal) * 100;
    return Math.min(Math.max(value, 0), 100);
  }

  get remainingGuests(): number {
    if (!this.metrics) return 0;
    const remaining = this.metrics.expectedTotal - this.metrics.totalEntered;
    return remaining > 0 ? remaining : 0;
  }

  get funnelData(): Array<{ label: string; value: number; icon: string }> {
    return [
      { label: 'Invitaciones generadas', value: this.stats?.invitationsGenerated ?? 0, icon: 'mail' },
      { label: 'Confirmados', value: this.stats?.confirmations ?? 0, icon: 'check_circle' },
      { label: 'Pendientes', value: this.stats?.pending ?? 0, icon: 'schedule' },
      { label: 'Declinados', value: this.stats?.declined ?? 0, icon: 'block' },
      { label: 'Escaneados', value: this.stats?.scanned ?? 0, icon: 'qr_code_scanner' }
    ];
  }

  get hasAlerts(): boolean {
    return this.alerts.length > 0;
  }

  goBack(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId]);
    } else {
      this.router.navigate(['/planner/events']);
    }
  }

  goToGuests(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'guests']);
    }
  }

  goToScans(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'scans']);
    }
  }

  refresh(): void {
    if (!this.loading) {
      this.loadData();
    }
  }
}
