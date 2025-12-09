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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { GuestsService } from '../services/guests.service';
import { type Invitation, InvitationStatus } from '../../../core/models';
import { DeliveryPanel } from '../delivery-panel/delivery-panel';

@Component({
  selector: 'app-invitations-list',
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
    MatCheckboxModule,
    MatDialogModule
  ],
  templateUrl: './invitations-list.html',
  styleUrl: './invitations-list.scss'
})
export class InvitationsList implements OnInit {
  invitations: Invitation[] = [];
  displayedColumns: string[] = ['select', 'inviteCode', 'guestCount', 'inviteType', 'status', 'sentAt', 'actions'];
  loading = true;
  eventId: string = '';
  selection = new SelectionModel<Invitation>(true, []);

  totalInvitations = 0;
  pageSize = 10;
  currentPage = 0;

  statusFilter = new FormControl('');
  invitationStatuses = Object.values(InvitationStatus);

  constructor(
    private guestsService: GuestsService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.loadInvitations();
    this.setupFilters();
  }

  setupFilters(): void {
    this.statusFilter.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadInvitations();
    });
  }

  loadInvitations(): void {
    this.loading = true;

    const filters = {
      status: this.statusFilter.value || undefined
    };

    this.guestsService.getEventInvitations(this.eventId, this.currentPage + 1, this.pageSize, filters).subscribe({
      next: (response) => {
        this.invitations = response.invitations;
        this.totalInvitations = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading invitations:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInvitations();
  }

  getStatusColor(status: InvitationStatus): string {
    const colors: Record<InvitationStatus, string> = {
      [InvitationStatus.PENDING]: 'accent',
      [InvitationStatus.SENT]: 'primary',
      [InvitationStatus.PENDING_DELIVERY]: 'accent',
      [InvitationStatus.DELIVERED]: 'primary',
      [InvitationStatus.BOUNCED]: 'warn',
      [InvitationStatus.FAILED]: 'warn'
    };
    return colors[status] || '';
  }

  getStatusLabel(status: InvitationStatus): string {
    const labels: Record<InvitationStatus, string> = {
      [InvitationStatus.PENDING]: 'Pendiente',
      [InvitationStatus.SENT]: 'Enviado',
      [InvitationStatus.PENDING_DELIVERY]: 'En Envío',
      [InvitationStatus.DELIVERED]: 'Entregado',
      [InvitationStatus.BOUNCED]: 'Rebotado',
      [InvitationStatus.FAILED]: 'Fallido'
    };
    return labels[status] || status;
  }

  viewQR(invitation: Invitation): void {
    alert(`QR Code para: ${invitation.inviteCode}\nURL: ${invitation.landingUrl}`);
  }

  resendInvitation(invitation: Invitation): void {
    if (confirm(`¿Reenviar invitación ${invitation.inviteCode}?`)) {
      this.guestsService.resendInvitation(invitation.id).subscribe({
        next: () => {
          alert('Invitación reenviada');
          this.loadInvitations();
        },
        error: (error) => {
          console.error('Error resending:', error);
          alert('Error al reenviar');
        }
      });
    }
  }

  generateInvitations(): void {
    this.router.navigate(['/planner/events', this.eventId, 'invitations', 'generate']);
  }

  goBack(): void {
    this.router.navigate(['/planner/events', this.eventId]);
  }

  openDeliveryPanel(): void {
    const selectedIds = this.selection.selected.map(inv => inv.id);

    this.dialog.open(DeliveryPanel, {
      data: {
        eventId: this.eventId,
        invitationIds: selectedIds
      },
      width: '1200px',
      maxHeight: '90vh'
    }).afterClosed().subscribe(() => {
      this.loadInvitations();
      this.selection.clear();
    });
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.invitations.length;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.invitations.forEach(row => this.selection.select(row));
    }
  }
}
