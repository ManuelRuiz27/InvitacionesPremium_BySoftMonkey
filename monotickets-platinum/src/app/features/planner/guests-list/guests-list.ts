import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';

import { GuestsService } from '../services/guests.service';
import { PlannerService, EventStats } from '../services/planner.service';
import { type Guest, RsvpStatus, RsvpSource } from '../../../core/models';
import { getInvitationStatusMeta } from '../../../shared/utils/status.utils';

@Component({
  selector: 'app-guests-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './guests-list.html',
  styleUrl: './guests-list.scss'
})
export class GuestsList implements OnInit {
  guests: Guest[] = [];
  displayedColumns: string[] = ['select', 'fullName', 'phone', 'email', 'guestCount', 'invitation', 'rsvpStatus', 'rsvpSource', 'notes', 'actions'];
  loading = true;
  eventId = '';
  processingGuestId: string | null = null;
  editingGuestId: string | null = null;
  inlineSavingGuestId: string | null = null;
  draftGuest = {
    fullName: '',
    guestCount: 1,
    notes: ''
  };

  totalGuests = 0;
  pageSize = 10;
  currentPage = 0;

  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  sourceFilter = new FormControl('');

  rsvpStatuses = Object.values(RsvpStatus);
  rsvpSources = Object.values(RsvpSource);

  eventStats: EventStats | null = null;
  statsLoading = true;

  selectedGuests = new Set<string>();
  bulkProcessing = false;

  constructor(
    private guestsService: GuestsService,
    private plannerService: PlannerService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.loadGuests();
    this.loadEventStats();
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
        this.syncSelectionWithPage();
      },
      error: (error) => {
        console.error('Error loading guests:', error);
        this.loading = false;
      }
    });
  }

  loadEventStats(): void {
    if (!this.eventId) return;

    this.statsLoading = true;
    this.plannerService.getEventStats(this.eventId).subscribe({
      next: (stats) => {
        this.eventStats = stats;
        this.statsLoading = false;
      },
      error: (error) => {
        console.error('Error loading event stats', error);
        this.statsLoading = false;
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
      [RsvpSource.HOST_LINK]: 'Link AnfitriA3n'
    };
    return labels[source] || source;
  }

  getInvitationMeta(guest: Guest) {
    return getInvitationStatusMeta(guest.invitationStatus);
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
    if (confirm(`Eliminar a ${guest.fullName}?`)) {
      this.guestsService.deleteGuest(this.eventId, guest.id).subscribe({
        next: () => {
          this.showSnack('Invitado eliminado');
          this.loadGuests();
          this.loadEventStats();
        },
        error: (error) => {
          console.error('Error deleting guest:', error);
          this.showSnack('Error al eliminar invitado');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/planner/events', this.eventId]);
  }

  confirmGuest(guest: Guest): void {
    this.processingGuestId = guest.id;
    this.guestsService.confirmGuest(this.eventId, guest.id).subscribe({
      next: () => {
        this.showSnack(`${guest.fullName} confirmado manualmente`);
        this.processingGuestId = null;
        this.loadGuests();
        this.loadEventStats();
      },
      error: (err) => {
        console.error('Error confirming guest', err);
        this.processingGuestId = null;
        this.showSnack('No se pudo confirmar al invitado');
      }
    });
  }

  declineGuest(guest: Guest): void {
    this.processingGuestId = guest.id;
    this.guestsService.declineGuest(this.eventId, guest.id).subscribe({
      next: () => {
        this.showSnack(`${guest.fullName} marcado como declinado`);
        this.processingGuestId = null;
        this.loadGuests();
        this.loadEventStats();
      },
      error: (err) => {
        console.error('Error declining guest', err);
        this.processingGuestId = null;
        this.showSnack('No se pudo actualizar el RSVP');
      }
    });
  }

  revokeInvitation(guest: Guest): void {
    if (!guest.invitationId) {
      this.showSnack('No hay invitaciA3n generada para este invitado');
      return;
    }
    if (!confirm(`Revocar la invitaciA3n de ${guest.fullName}?`)) {
      return;
    }
    this.processingGuestId = guest.id;
    this.guestsService.revokeInvitation(guest.invitationId).subscribe({
      next: () => {
        this.showSnack('InvitaciA3n revocada');
        this.processingGuestId = null;
        this.loadGuests();
        this.loadEventStats();
      },
      error: (err) => {
        console.error('Error revoking invitation', err);
        this.processingGuestId = null;
        this.showSnack('No se pudo revocar la invitaciA3n');
      }
    });
  }

  resendInvitation(guest: Guest): void {
    if (!guest.invitationId) {
      this.showSnack('No hay invitaciA3n para reenviar');
      return;
    }
    this.processingGuestId = guest.id;
    this.guestsService.resendInvitation(guest.invitationId).subscribe({
      next: () => {
        this.showSnack('InvitaciA3n reenviada');
        this.processingGuestId = null;
        this.loadEventStats();
      },
      error: (err) => {
        console.error('Error resending invitation', err);
        this.processingGuestId = null;
        this.showSnack('No se pudo reenviar la invitaciA3n');
      }
    });
  }

  startInlineEdit(guest: Guest): void {
    this.editingGuestId = guest.id;
    this.draftGuest = {
      fullName: guest.fullName || '',
      guestCount: guest.guestCount || 1,
      notes: guest.notes || ''
    };
  }

  cancelInlineEdit(): void {
    this.editingGuestId = null;
    this.inlineSavingGuestId = null;
  }

  saveInlineGuest(guest: Guest): void {
    if (!this.editingGuestId) {
      return;
    }
    const payload = {
      fullName: (this.draftGuest.fullName || '').trim(),
      guestCount: this.draftGuest.guestCount,
      notes: (this.draftGuest.notes || '').trim() || null
    };
    if (!payload.fullName) {
      this.showSnack('El nombre no puede estar vacA-o');
      return;
    }
    this.inlineSavingGuestId = guest.id;
    this.guestsService.updateGuest(this.eventId, guest.id, payload).subscribe({
      next: (updatedGuest) => {
        const idx = this.guests.findIndex(g => g.id === guest.id);
        if (idx >= 0) {
          this.guests[idx] = { ...this.guests[idx], ...updatedGuest };
        }
        this.showSnack('Invitado actualizado');
        this.inlineSavingGuestId = null;
        this.editingGuestId = null;
        this.loadEventStats();
      },
      error: (err) => {
        console.error('Error updating guest', err);
        this.inlineSavingGuestId = null;
        this.showSnack('No se pudo actualizar al invitado');
      }
    });
  }

  isEditing(guestId: string): boolean {
    return this.editingGuestId === guestId;
  }

  updateDraftGuestCount(delta: number): void {
    const next = (this.draftGuest.guestCount || 1) + delta;
    this.draftGuest.guestCount = Math.max(1, next);
  }

  isSelected(guest: Guest): boolean {
    return this.selectedGuests.has(guest.id);
  }

  toggleGuestSelection(guest: Guest, change: MatCheckboxChange): void {
    if (change.checked) {
      this.selectedGuests.add(guest.id);
    } else {
      this.selectedGuests.delete(guest.id);
    }
  }

  toggleSelectAll(change: MatCheckboxChange): void {
    if (change.checked) {
      this.guests.forEach(guest => this.selectedGuests.add(guest.id));
    } else {
      this.selectedGuests.clear();
    }
  }

  areAllSelectedOnPage(): boolean {
    return this.guests.length > 0 && this.guests.every(g => this.selectedGuests.has(g.id));
  }

  hasSelection(): boolean {
    return this.selectedGuests.size > 0;
  }

  selectionCount(): number {
    return this.selectedGuests.size;
  }

  selectedWithInvitationCount(): number {
    return this.getSelectedGuests().filter(g => !!g.invitationId).length;
  }

  clearSelection(): void {
    this.selectedGuests.clear();
  }

  performBulkAction(action: 'confirm' | 'decline' | 'resend' | 'revoke'): void {
    const guests = this.getSelectedGuests();
    if (!guests.length) {
      this.showSnack('Selecciona al menos un invitado');
      return;
    }

    let targets = guests;
    if (action === 'resend' || action === 'revoke') {
      targets = guests.filter(g => !!g.invitationId);
      if (!targets.length) {
        this.showSnack('Todos los seleccionados necesitan tener invitaciA3n');
        return;
      }
    }

    const requests = targets.map(guest => {
      switch (action) {
        case 'confirm':
          return this.guestsService.confirmGuest(this.eventId, guest.id);
        case 'decline':
          return this.guestsService.declineGuest(this.eventId, guest.id);
        case 'resend':
          return this.guestsService.resendInvitation(guest.invitationId!);
        case 'revoke':
        default:
          return this.guestsService.revokeInvitation(guest.invitationId!);
      }
    });

    this.bulkProcessing = true;
    forkJoin(requests).subscribe({
      next: () => {
        this.bulkProcessing = false;
        this.showSnack(`Acción aplicada a ${targets.length} invitado(s)`);
        this.clearSelection();
        this.loadGuests();
        this.loadEventStats();
      },
      error: (error) => {
        console.error('Bulk action failure', error);
        this.bulkProcessing = false;
        this.showSnack('Ocurrió un problema en la acción masiva');
        this.loadGuests();
        this.loadEventStats();
      }
    });
  }

  private getSelectedGuests(): Guest[] {
    return this.guests.filter(guest => this.selectedGuests.has(guest.id));
  }

  private syncSelectionWithPage(): void {
    this.selectedGuests = new Set(Array.from(this.selectedGuests).filter(id => this.guests.some(g => g.id === id)));
  }

  private showSnack(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }
}
