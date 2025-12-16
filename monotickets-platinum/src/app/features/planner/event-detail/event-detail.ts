import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { PlannerService, EventStats } from '../services/planner.service';
import { type Event, EventType, EventStatus } from '../../../core/models';
import { getEventStatusMeta } from '../../../shared/utils/status.utils';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatRadioModule,
    MatSnackBarModule
  ],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss'
})
export class EventDetail implements OnInit {
  @ViewChild('exportDialog') exportDialogTemplate?: TemplateRef<any>;

  event: Event | null = null;
  eventStats: EventStats | null = null;
  loading = true;
  eventId: string | null = null;
  exportFormat: 'csv' | 'xlsx' = 'csv';
  exporting = false;
  private exportDialogRef?: MatDialogRef<any>;

  readonly kpis: Array<{ key: keyof EventStats; label: string; icon: string }> = [
    { key: 'invitationsGenerated', label: 'Invitaciones generadas', icon: 'mail' },
    { key: 'confirmations', label: 'Confirmados', icon: 'check_circle' },
    { key: 'pending', label: 'Pendientes', icon: 'schedule' },
    { key: 'declined', label: 'Declinados', icon: 'block' },
    { key: 'scanned', label: 'Escaneados', icon: 'qr_code_scanner' }
  ];

  constructor(
    private plannerService: PlannerService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.loadEvent(this.eventId);
    }
  }

  loadEvent(id: string): void {
    this.loading = true;
    forkJoin({
      event: this.plannerService.getEventById(id),
      stats: this.plannerService.getEventStats(id)
    }).subscribe({
      next: ({ event, stats }) => {
        this.event = event;
        this.eventStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        alert('Error al cargar el evento');
        this.goBack();
      }
    });
  }

  getTypeLabel(type: EventType): string {
    const labels: Record<EventType, string> = {
      [EventType.BODA]: 'Boda',
      [EventType.XV]: 'XV Años',
      [EventType.GRADUACION]: 'Graduación',
      [EventType.BAUTIZO]: 'Bautizo',
      [EventType.BABY_SHOWER]: 'Baby Shower',
      [EventType.ANIVERSARIO]: 'Aniversario',
      [EventType.COMUNION]: 'Comunión',
      [EventType.SOCIAL]: 'Social'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: EventStatus): string {
    return getEventStatusMeta(status).label;
  }

  getStatusColor(status: EventStatus): string {
    return getEventStatusMeta(status).className;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  editEvent(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'edit']);
    }
  }

  deleteEvent(): void {
    if (!this.event) return;

    if (confirm(`¿Estás seguro de eliminar el evento "${this.event.name}"?`)) {
      this.plannerService.deleteEvent(this.event.id).subscribe({
        next: () => {
          alert('Evento eliminado exitosamente');
          this.router.navigate(['/planner/events']);
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          alert('Error al eliminar el evento');
        }
      });
    }
  }

  navigateToGuests(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'guests']);
    }
  }

  navigateToInvitations(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'invitations']);
    }
  }

  viewScans(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'scans']);
    }
  }

  manageRSVP(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'rsvp-generator']);
    }
  }

  manageHostLinks(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'host-links']);
    }
  }

  customizeInvitation(): void {
    if (!this.eventId || !this.event) return;
    const target =
      this.event.templateType === 'PREMIUM'
        ? ['/planner/events', this.eventId, 'premium']
        : ['/planner/events', this.eventId, 'templates'];
    this.router.navigate(target);
  }

  sendInvitations(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'invitations', 'generate']);
    }
  }

  viewMetrics(): void {
    if (this.eventId) {
      this.router.navigate(['/planner/events', this.eventId, 'metrics']);
    }
  }

  openExportDialog(): void {
    if (!this.exportDialogTemplate) return;
    this.exportFormat = 'csv';
    this.exporting = false;
    this.exportDialogRef = this.dialog.open(this.exportDialogTemplate, { width: '420px' });
  }

  confirmExport(): void {
    if (!this.eventId || this.exporting) {
      return;
    }
    this.exporting = true;
    this.plannerService.exportGuestsList(this.eventId, this.exportFormat).subscribe({
      next: (blob) => {
        const slug = (this.event?.name || 'evento').replace(/\s+/g, '_').toLowerCase();
        this.downloadFile(blob, `guests-${slug}.${this.exportFormat}`);
        this.exporting = false;
        this.exportDialogRef?.close();
        this.showNotification('Exportación generada correctamente');
      },
      error: (error) => {
        console.error('Error exporting guests', error);
        this.exporting = false;
        this.showNotification('No se pudo generar la exportación');
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  getKpiValue(key: keyof EventStats): number {
    if (!this.eventStats) return 0;
    return Number(this.eventStats[key] ?? 0);
  }

  goBack(): void {
    this.router.navigate(['/planner/events']);
  }
}
