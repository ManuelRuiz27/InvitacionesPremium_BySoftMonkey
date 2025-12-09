import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GuestService, type InvitationData } from '../services/guest';

@Component({
  selector: 'app-invitation-landing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './invitation-landing.html',
  styleUrl: './invitation-landing.scss'
})
export class InvitationLanding implements OnInit {
  inviteCode: string = '';
  loading = true;
  error: string | null = null;

  invitationData: InvitationData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestService: GuestService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.inviteCode = this.route.snapshot.paramMap.get('inviteCode') || '';

    if (!this.inviteCode) {
      this.error = 'Código de invitación inválido';
      this.loading = false;
      return;
    }

    this.loadInvitation();
  }

  loadInvitation(): void {
    this.loading = true;
    this.error = null;

    this.guestService.getInvitationByCode(this.inviteCode).subscribe({
      next: (data) => {
        this.invitationData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading invitation:', err);
        this.error = 'No se pudo cargar la invitación. Verifica el código.';
        this.loading = false;
      }
    });
  }

  goToRsvp(): void {
    this.router.navigate(['/i', this.inviteCode, 'rsvp']);
  }

  downloadCalendar(): void {
    this.guestService.downloadCalendar(this.inviteCode).subscribe({
      next: (blob) => {
        this.guestService.saveCalendarFile(blob, `evento-${this.inviteCode}.ics`);
      },
      error: (err) => {
        console.error('Error downloading calendar:', err);
        alert('Error al descargar calendario');
      }
    });
  }

  isPremium(): boolean {
    return this.invitationData?.event.templateType === 'PREMIUM';
  }

  getEventDate(): string {
    if (!this.invitationData) return '';
    const date = new Date(this.invitationData.event.date);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openGalleryLightbox(index: number): void {
    // TODO: Implement lightbox modal
    // For now, open image in new tab
    if (this.invitationData?.event.customization?.galleryImages) {
      const imageUrl = this.invitationData.event.customization.galleryImages[index];
      window.open(imageUrl, '_blank');
    }
  }

  getMapUrl(): SafeResourceUrl {
    if (!this.invitationData?.event.locationLat || !this.invitationData?.event.locationLng) {
      return '';
    }
    const lat = this.invitationData.event.locationLat;
    const lng = this.invitationData.event.locationLng;
    const url = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openMapDirections(): void {
    if (!this.invitationData?.event.locationLat || !this.invitationData?.event.locationLng) {
      return;
    }
    const lat = this.invitationData.event.locationLat;
    const lng = this.invitationData.event.locationLng;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }
}
