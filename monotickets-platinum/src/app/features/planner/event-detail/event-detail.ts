import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PlannerService } from '../services/planner.service';
import { type Event, EventType, EventStatus } from '../../../core/models';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss'
})
export class EventDetail implements OnInit {
  event: Event | null = null;
  loading = true;
  eventId: string | null = null;

  constructor(
    private plannerService: PlannerService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (this.eventId) {
      this.loadEvent(this.eventId);
    }
  }

  loadEvent(id: string): void {
    this.loading = true;
    this.plannerService.getEventById(id).subscribe({
      next: (event) => {
        this.event = event;
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
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'Publicado';
      case EventStatus.DRAFT:
        return 'Borrador';
      case EventStatus.CLOSED:
        return 'Cerrado';
      default:
        return status;
    }
  }

  getStatusColor(status: EventStatus): string {
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'primary';
      case EventStatus.DRAFT:
        return 'accent';
      case EventStatus.CLOSED:
        return 'warn';
      default:
        return '';
    }
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

  goBack(): void {
    this.router.navigate(['/planner/events']);
  }
}
