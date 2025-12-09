import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { GuestsService } from '../services/guests.service';
import { type Guest, RsvpStatus, RsvpSource } from '../../../core/models';

@Component({
  selector: 'app-guests-list',
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
    MatInputModule
  ],
  templateUrl: './guests-list.html',
  styleUrl: './guests-list.scss'
})
export class GuestsList implements OnInit {
  guests: Guest[] = [];
  displayedColumns: string[] = ['fullName', 'phone', 'email', 'rsvpStatus', 'rsvpSource', 'actions'];
  loading = true;
  eventId: string = '';

  totalGuests = 0;
  pageSize = 10;
  currentPage = 0;

  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  sourceFilter = new FormControl('');

  rsvpStatuses = Object.values(RsvpStatus);
  rsvpSources = Object.values(RsvpSource);

  constructor(
    private guestsService: GuestsService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.loadGuests();
    this.setupFilters();
  }

  setupFilters(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadGuests();
    });

    this.statusFilter.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadGuests();
    });

    this.sourceFilter.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadGuests();
    });
  }

  loadGuests(): void {
    this.loading = true;

    const filters = {
      search: this.searchControl.value || undefined,
      rsvpStatus: this.statusFilter.value || undefined,
      rsvpSource: this.sourceFilter.value || undefined
    };

    this.guestsService.getEventGuests(this.eventId, this.currentPage + 1, this.pageSize, filters).subscribe({
      next: (response) => {
        this.guests = response.guests;
        this.totalGuests = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading guests:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadGuests();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('');
    this.sourceFilter.setValue('');
  }

  getStatusColor(status: RsvpStatus): string {
    switch (status) {
      case RsvpStatus.CONFIRMED:
        return 'primary';
      case RsvpStatus.PENDING:
        return 'accent';
      case RsvpStatus.DECLINED:
        return 'warn';
      default:
        return '';
    }
  }

  getStatusLabel(status: RsvpStatus): string {
    switch (status) {
      case RsvpStatus.CONFIRMED:
        return 'Confirmado';
      case RsvpStatus.PENDING:
        return 'Pendiente';
      case RsvpStatus.DECLINED:
        return 'Declinado';
      default:
        return status;
    }
  }

  getSourceLabel(source: RsvpSource): string {
    const labels: Record<RsvpSource, string> = {
      [RsvpSource.CSV]: 'CSV',
      [RsvpSource.MANUAL]: 'Manual',
      [RsvpSource.RSVP_FORM]: 'Formulario',
      [RsvpSource.HOST_LINK]: 'Link Anfitrión'
    };
    return labels[source] || source;
  }

  uploadCSV(): void {
    this.router.navigate(['/planner/events', this.eventId, 'guests', 'upload']);
  }

  createGuest(): void {
    this.router.navigate(['/planner/events', this.eventId, 'guests', 'new']);
  }

  editGuest(guestId: string): void {
    this.router.navigate(['/planner/events', this.eventId, 'guests', guestId, 'edit']);
  }

  deleteGuest(guest: Guest): void {
    if (confirm(`¿Eliminar a ${guest.fullName}?`)) {
      this.guestsService.deleteGuest(this.eventId, guest.id).subscribe({
        next: () => {
          this.loadGuests();
        },
        error: (error) => {
          console.error('Error deleting guest:', error);
          alert('Error al eliminar invitado');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/planner/events', this.eventId]);
  }
}
