import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import {
  GuestService,
  type InvitationData,
  type PremiumInvitationConfig,
  type InvitationAccess
} from '../services/guest';

const DEFAULT_PALETTE = {
  primary: '#1D1B31',
  secondary: '#4338CA',
  accent: '#0EA5E9',
  background: '#FFFFFF'
};

@Component({
  selector: 'app-invitation-landing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './invitation-landing.html',
  styleUrl: './invitation-landing.scss'
})
export class InvitationLanding implements OnInit {
  inviteCode = '';
  loading = true;
  error: string | null = null;

  invitationData: InvitationData | null = null;
  reminderOptions = [
    { label: '1 mes antes', value: 'P1M' },
    { label: '15 dias antes', value: 'P15D' },
    { label: '1 semana antes', value: 'P7D' },
    { label: '3 dias antes', value: 'P3D' }
  ];
  selectedReminders = new Set<string>(['P7D', 'P3D']);
  calendarDownloading = false;
  declineLoading = false;
  accessLoading = false;
  accessInfo: InvitationAccess | null = null;
  memoryData: any | null = null;
  memoryLoading = false;
  memoryError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestService: GuestService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.inviteCode = this.route.snapshot.paramMap.get('inviteCode') || '';

    if (!this.inviteCode) {
      this.error = 'Codigo de invitacion invalido';
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
        if (this.isEventPast()) {
          this.loadMemoryView();
        }
        this.loadAccessStatus();
      },
      error: (err) => {
        console.error('Error loading invitation:', err);
        this.error = 'No se pudo cargar la invitacion. Verifica el codigo.';
        this.loading = false;
      }
    });
  }

  loadAccessStatus(): void {
    if (this.accessLoading) {
      return;
    }
    this.accessLoading = true;
    this.guestService.getInvitationAccess(this.inviteCode).subscribe({
      next: (access) => {
        this.accessInfo = access;
        this.accessLoading = false;
        if (!this.memoryData && this.isMemoryAvailable()) {
          this.loadMemoryView();
        }
      },
      error: (err) => {
        console.warn('No se pudo cargar el estado de acceso:', err);
        this.accessLoading = false;
      }
    });
  }

  goToRsvp(): void {
    this.router.navigate(['/i', this.inviteCode, 'rsvp']);
  }

  downloadCalendar(): void {
    if (this.calendarDownloading) {
      return;
    }
    const reminders = Array.from(this.selectedReminders);
    this.calendarDownloading = true;
    this.guestService.downloadCalendar(this.inviteCode, reminders).subscribe({
      next: (blob) => {
        this.guestService.saveCalendarFile(blob, `evento-${this.inviteCode}.ics`);
        this.calendarDownloading = false;
      },
      error: (err) => {
        console.error('Error downloading calendar:', err);
        alert('Error al descargar el calendario');
        this.calendarDownloading = false;
      }
    });
  }

  toggleReminder(value: string, selected: boolean): void {
    if (selected) {
      this.selectedReminders.add(value);
    } else {
      this.selectedReminders.delete(value);
    }
  }

  loadMemoryView(): void {
    if (this.memoryLoading) {
      return;
    }
    this.memoryLoading = true;
    this.memoryError = null;
    this.guestService.getMemoryView(this.inviteCode).subscribe({
      next: (data) => {
        this.memoryData = data;
        this.memoryLoading = false;
      },
      error: (err) => {
        console.error('Error loading memory view:', err);
        this.memoryError = err?.error?.message || 'No se pudo cargar el modo recuerdo';
        this.memoryLoading = false;
      }
    });
  }

  downloadMemoryPdf(): void {
    this.guestService.downloadMemoryPdf(this.inviteCode).subscribe({
      next: (blob) => {
        this.guestService.saveCalendarFile(blob, `recuerdo-${this.inviteCode}.pdf`);
      },
      error: (err) => {
        console.error('Error downloading memory PDF:', err);
        alert('No se pudo descargar el PDF de recuerdo');
      }
    });
  }

  isPremium(): boolean {
    return this.invitationData?.event.templateType === 'PREMIUM';
  }

  getEventDate(): string {
    const date = this.getEventDateValue();
    if (!date) return '';
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openGalleryLightbox(index: number): void {
    if (this.getGalleryImages().length) {
      const imageUrl = this.getGalleryImages()[index];
      window.open(imageUrl, '_blank');
    }
  }

  getMapUrl(): SafeResourceUrl {
    if (!this.invitationData?.event.locationLat || !this.invitationData?.event.locationLng) {
      return '' as SafeResourceUrl;
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

  get paletteStyles(): Record<string, string> {
    const palette = this.getPremiumPalette();
    return {
      '--premium-primary': palette.primary,
      '--premium-secondary': palette.secondary,
      '--premium-accent': palette.accent,
      '--premium-background': palette.background
    };
  }

  getHeroStyles(): Record<string, string> {
    const palette = this.getPremiumPalette();
    return {
      backgroundImage: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`
    };
  }

  get premiumCoverTitle(): string {
    return this.premiumConfig?.cover?.title || this.invitationData?.event.name || '';
  }

  get premiumCoverSubtitle(): string {
    return this.premiumConfig?.cover?.subtitle || this.getEventDate();
  }

  get premiumRsvpMessage(): string {
    return this.premiumConfig?.rsvp?.message || 'Confirma tu asistencia para reservar tu lugar.';
  }

  getCoverImageUrl(): string {
    return this.premiumConfig?.cover?.imageUrl || this.invitationData?.event.customization?.coverImageUrl || '';
  }

  getInfoBlocks(): Array<{ title: string; details: string }> {
    const blocks = this.premiumConfig?.infoBlocks || [];
    return blocks
      .filter(block => (block?.title || block?.details))
      .map(block => ({
        title: block.title || 'Detalle',
        details: block.details || ''
      }));
  }

  getStoryText(): string {
    return this.premiumConfig?.story?.text?.trim() || '';
  }

  getStoryPhotos(): string[] {
    return this.premiumConfig?.story?.photoUrls || [];
  }

  hasGallery(): boolean {
    const gallery = this.premiumConfig?.gallery;
    return !!(gallery?.enabled && gallery?.imageUrls && gallery.imageUrls.length);
  }

  getGalleryImages(): string[] {
    if (this.hasGallery()) {
      return this.premiumConfig?.gallery?.imageUrls || [];
    }
    return this.invitationData?.event.customization?.galleryImages || [];
  }

  get premiumConfig(): PremiumInvitationConfig | null {
    return this.invitationData?.event.premiumConfig || null;
  }

  isConfirmed(): boolean {
    return this.invitationData?.guest?.rsvpStatus === 'CONFIRMED';
  }

  isDeclined(): boolean {
    return this.invitationData?.guest?.rsvpStatus === 'DECLINED';
  }

  isQrUnlocked(): boolean {
    return this.accessInfo?.status === 'UNLOCKED';
  }

  isQrBlocked(): boolean {
    return this.accessInfo?.status === 'BLOCKED';
  }

  isQrExpired(): boolean {
    return this.accessInfo?.status === 'EXPIRED';
  }

  getAccessMessage(): string {
    if (this.accessInfo?.message) {
      return this.accessInfo.message;
    }
    if (this.isConfirmed() && !this.isEventToday() && !this.isEventPast()) {
      return 'El codigo estara disponible el dia del evento. Recuerda llegar con tiempo para tu registro.';
    }
    if (this.isConfirmed() && this.isEventToday()) {
      return 'Acceso habilitado. Muestra tu codigo al staff al llegar.';
    }
    if (this.isConfirmed() && this.isEventPast()) {
      return 'Gracias por acompanarnos. El modo recuerdo permanece disponible por tiempo limitado.';
    }
    if (this.isDeclined()) {
      return 'Has indicado que no podras asistir. Si deseas revertirlo, vuelve a confirmar tu asistencia.';
    }
    return '';
  }

  isEventToday(): boolean {
    const eventDate = this.getEventDateValue();
    if (!eventDate) return false;
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }

  isEventPast(): boolean {
    const eventDate = this.getEventDateValue();
    if (!eventDate) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return eventDate.getTime() < todayStart.getTime();
  }

  shouldShowStatusPanel(): boolean {
    return !!this.accessInfo || this.isConfirmed() || this.isDeclined();
  }

  getAccessStatusLabel(): string {
    switch (this.accessInfo?.status) {
      case 'UNLOCKED':
        return 'Acceso habilitado';
      case 'LOCKED':
        return 'Acceso bloqueado';
      case 'BLOCKED':
        return 'Evento bloqueado';
      case 'EXPIRED':
        return 'Evento finalizado';
      case 'DECLINED':
        return 'Asistencia cancelada';
      default:
        return this.isConfirmed() ? 'Asistencia confirmada' : 'Estado de invitacion';
    }
  }

  isMemoryAvailable(): boolean {
    return this.isEventPast() || this.isQrExpired();
  }

  formatDateTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canUpdateRsvp(): boolean {
    if (!this.isConfirmed()) return false;
    const deliveryDate = this.getDeliveryDate();
    const now = new Date();
    const maxWindowMs = 20 * 24 * 60 * 60 * 1000;
    if (deliveryDate) {
      return now.getTime() - deliveryDate.getTime() <= maxWindowMs;
    }
    const eventDate = this.getEventDateValue();
    if (!eventDate) return true;
    return eventDate.getTime() - now.getTime() >= maxWindowMs;
  }

  getGuestCapacity(): number {
    return (
      this.invitationData?.invitation?.guestCount ||
      this.invitationData?.guest?.guestCount ||
      1
    );
  }

  goToQr(): void {
    if (!this.isQrUnlocked()) {
      return;
    }
    this.router.navigate(['/i', this.inviteCode, 'qr']);
  }

  declineAttendance(): void {
    if (!this.inviteCode || this.declineLoading) {
      return;
    }
    this.declineLoading = true;
    this.guestService.confirmRsvp(this.inviteCode, {
      rsvpStatus: 'DECLINED',
      guestCount: 0
    }).subscribe({
      next: () => {
        this.declineLoading = false;
        this.loadInvitation();
      },
      error: (err) => {
        console.error('Error declining RSVP:', err);
        alert('No se pudo registrar el cambio de asistencia.');
        this.declineLoading = false;
      }
    });
  }

  private getDeliveryDate(): Date | null {
    const deliveredAt = this.invitationData?.invitation?.deliveredAt || this.invitationData?.invitation?.sentAt || this.invitationData?.invitation?.createdAt;
    if (!deliveredAt) return null;
    return new Date(deliveredAt);
  }

  private getEventDateValue(): Date | null {
    const event = this.invitationData?.event;
    if (!event) {
      return null;
    }
    if (event.eventAt) {
      return new Date(event.eventAt);
    }
    if (event.date) {
      if (event.time) {
        return new Date(`${event.date}T${event.time}`);
      }
      return new Date(event.date);
    }
    return null;
  }

  private getPremiumPalette() {
    const palette = this.premiumConfig?.palette || {};
    return {
      primary: palette.primary || DEFAULT_PALETTE.primary,
      secondary: palette.secondary || DEFAULT_PALETTE.secondary,
      accent: palette.accent || DEFAULT_PALETTE.accent,
      background: palette.background || DEFAULT_PALETTE.background
    };
  }
}
