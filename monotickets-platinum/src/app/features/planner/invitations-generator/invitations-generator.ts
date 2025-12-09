import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';

import { GuestsService } from '../services/guests.service';
import { type Guest } from '../../../core/models';

@Component({
  selector: 'app-invitations-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTableModule
  ],
  templateUrl: './invitations-generator.html',
  styleUrl: './invitations-generator.scss'
})
export class InvitationsGenerator implements OnInit {
  eventId: string = '';
  guests: Guest[] = [];
  selectedGuests: Set<string> = new Set();
  loading = false;
  generating = false;
  progress = 0;
  result: { generated: number } | null = null;

  displayedColumns: string[] = ['select', 'fullName', 'phone', 'rsvpStatus'];

  constructor(
    private guestsService: GuestsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
  }

  ngOnInit(): void {
    this.loadGuests();
  }

  loadGuests(): void {
    this.loading = true;
    this.guestsService.getEventGuests(this.eventId, 1, 100).subscribe({
      next: (response) => {
        this.guests = response.guests;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading guests:', error);
        this.loading = false;
      }
    });
  }

  toggleGuest(guestId: string): void {
    if (this.selectedGuests.has(guestId)) {
      this.selectedGuests.delete(guestId);
    } else {
      this.selectedGuests.add(guestId);
    }
  }

  isSelected(guestId: string): boolean {
    return this.selectedGuests.has(guestId);
  }

  selectAll(): void {
    this.guests.forEach(g => this.selectedGuests.add(g.id));
  }

  deselectAll(): void {
    this.selectedGuests.clear();
  }

  generateInvitations(): void {
    if (this.selectedGuests.size === 0) {
      alert('Selecciona al menos un invitado');
      return;
    }

    this.generating = true;
    this.progress = 0;

    const interval = setInterval(() => {
      this.progress += 10;
      if (this.progress >= 90) {
        clearInterval(interval);
      }
    }, 100);

    const guestIds = Array.from(this.selectedGuests);

    this.guestsService.generateInvitations(this.eventId, guestIds).subscribe({
      next: (result) => {
        clearInterval(interval);
        this.progress = 100;
        this.result = result;
        this.generating = false;

        setTimeout(() => {
          this.goBack();
        }, 2000);
      },
      error: (error) => {
        clearInterval(interval);
        console.error('Error generating invitations:', error);
        alert('Error al generar invitaciones');
        this.generating = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/planner/events', this.eventId, 'invitations']);
  }
}
