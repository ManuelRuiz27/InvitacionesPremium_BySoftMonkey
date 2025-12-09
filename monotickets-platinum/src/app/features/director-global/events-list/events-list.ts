import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { DirectorService } from '../services/director.service';
import { Event, EventType, EventStatus } from '../../../core/models';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './events-list.html',
  styleUrl: './events-list.scss'
})
export class EventsList implements OnInit {
  events: Event[] = [];
  displayedColumns: string[] = ['name', 'type', 'date', 'location', 'template', 'status', 'actions'];
  loading = true;

  // Pagination
  totalEvents = 0;
  pageSize = 10;
  currentPage = 0;

  // Filters
  selectedPlannerId: string = '';
  eventTypes = Object.values(EventType);

  constructor(
    private directorService: DirectorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.directorService.getAllEvents(
      this.currentPage + 1,
      this.pageSize,
      this.selectedPlannerId || undefined
    ).subscribe({
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

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadEvents();
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

  viewEventDetail(eventId: string): void {
    // TODO: Navigate to event detail when implemented
    console.log('View event:', eventId);
  }

  goBack(): void {
    this.router.navigate(['/director/dashboard']);
  }
}
