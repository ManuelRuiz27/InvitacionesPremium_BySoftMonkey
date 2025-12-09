import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { PlannerService } from '../services/planner.service';
import { type Event, EventType, EventStatus } from '../../../core/models';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule
  ],
  templateUrl: './events-list.html',
  styleUrl: './events-list.scss'
})
export class EventsList implements OnInit {
  events: Event[] = [];
  displayedColumns: string[] = ['name', 'type', 'date', 'status', 'actions'];
  loading = true;

  // Pagination
  totalEvents = 0;
  pageSize = 10;
  currentPage = 0;

  // Filters
  searchControl = new FormControl('');
  typeFilter = new FormControl('');
  statusFilter = new FormControl('');

  eventTypes = Object.values(EventType);
  eventStatuses = Object.values(EventStatus);

  constructor(
    private plannerService: PlannerService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadEvents();
    this.setupFilters();
  }

  setupFilters(): void {
    // Search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadEvents();
    });

    // Type filter
    this.typeFilter.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadEvents();
    });

    // Status filter
    this.statusFilter.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadEvents();
    });
  }

  loadEvents(): void {
    this.loading = true;

    const filters = {
      search: this.searchControl.value || undefined,
      type: this.typeFilter.value || undefined,
      status: this.statusFilter.value || undefined
    };

    this.plannerService.getMyEvents(this.currentPage + 1, this.pageSize, filters).subscribe({
      next: (response) => {
        this.events = response.events;
        this.totalEvents = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEvents();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.typeFilter.setValue('');
    this.statusFilter.setValue('');
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  createEvent(): void {
    this.router.navigate(['/planner/events/new']);
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/planner/events', eventId]);
  }

  editEvent(eventId: string): void {
    this.router.navigate(['/planner/events', eventId, 'edit']);
  }

  deleteEvent(event: Event): void {
    if (confirm(`¿Estás seguro de eliminar el evento "${event.name}"?`)) {
      this.plannerService.deleteEvent(event.id).subscribe({
        next: () => {
          this.loadEvents();
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          alert('Error al eliminar el evento');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/planner/dashboard']);
  }
}
