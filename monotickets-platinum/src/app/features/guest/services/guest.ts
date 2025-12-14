import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MockDataService } from '../../../core/services/mock-data.service';
import { RsvpStatus, RsvpSource } from '../../../core/models';

// Interfaces
export interface InvitationData {
  invitation: {
    id: string;
    inviteCode: string;
    guestCount: number;
    inviteType: string;
    landingUrl: string;
    pdfUrl?: string;
    status: string;
  };
  event: {
    id: string;
    name: string;
    type: string;
    date: string;
    time: string;
    locationText: string;
    locationLat?: number;
    locationLng?: number;
    templateType: string;
    templateVariant?: string;
    customization?: {
      primaryColor: string;
      secondaryColor: string;
      coverImageUrl?: string;
      galleryImages?: string[];
      giftTableUrl?: string;
      additionalInfo?: string;
    };
  };
  guest: {
    id: string;
    fullName: string;
    phone: string;
    rsvpStatus: string;
  };
}

export interface RsvpData {
  rsvpStatus: 'CONFIRMED' | 'DECLINED';
  guestCount: number;
  notes?: string;
}

export interface RsvpResponse {
  message: string;
  invitation: any;
  guest: any;
  qrGenerated: boolean;
  qrToken?: string;
}

export interface QrData {
  qrToken: string;
  qrDataUrl: string;
  expiresAt: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private apiUrl = `${environment.apiUrl}/guest`;
  private useMockData = true; // Cambiar a false cuando backend esté listo

  constructor(
    private http: HttpClient,
    private mockDataService: MockDataService
  ) { }

  /**
   * Obtener información de la invitación por código
   */
  getInvitationByCode(inviteCode: string): Observable<InvitationData> {
    if (this.useMockData) {
      return this.getMockInvitation(inviteCode);
    }
    return this.http.get<InvitationData>(`${this.apiUrl}/invitation/${inviteCode}`);
  }

  /**
   * Confirmar RSVP
   */
  confirmRsvp(inviteCode: string, data: RsvpData): Observable<RsvpResponse> {
    if (this.useMockData) {
      return this.mockConfirmRsvp(inviteCode, data).pipe(
        tap(response => {
          // Actualizar estado RSVP en MockDataService
          const rsvpStatus = data.rsvpStatus === 'CONFIRMED' ? RsvpStatus.CONFIRMED : RsvpStatus.DECLINED;
          this.mockDataService.updateGuestRSVPStatus(
            response.guest.id,
            rsvpStatus,
            RsvpSource.RSVP_FORM
          );
        })
      );
    }
    return this.http.post<RsvpResponse>(`${this.apiUrl}/rsvp/${inviteCode}`, data);
  }

  /**
   * Obtener código QR
   */
  getQrCode(inviteCode: string): Observable<QrData> {
    if (this.useMockData) {
      return this.getMockQrCode(inviteCode);
    }
    return this.http.get<QrData>(`${this.apiUrl}/qr/${inviteCode}`);
  }

  /**
   * Descargar calendario ICS
   */
  downloadCalendar(inviteCode: string): Observable<Blob> {
    if (this.useMockData) {
      return this.getMockCalendar(inviteCode);
    }
    return this.http.get(`${this.apiUrl}/calendar/${inviteCode}`, { responseType: 'blob' });
  }

  // ========== MOCK DATA METHODS ==========

  private getMockInvitation(inviteCode: string): Observable<InvitationData> {
    const mockData: InvitationData = {
      invitation: {
        id: 'inv-001',
        inviteCode: inviteCode,
        guestCount: 2,
        inviteType: 'FAMILY',
        landingUrl: `https://monotickets.com/i/${inviteCode}`,
        pdfUrl: 'https://example.com/invitation.pdf',
        status: 'DELIVERED'
      },
      event: {
        id: 'e1',
        name: 'Boda de Juan y Laura',
        type: 'WEDDING',
        date: '2025-06-15',
        time: '18:00',
        locationText: 'Jardín Botánico de la Ciudad',
        locationLat: 19.4326,
        locationLng: -99.1332,
        templateType: 'PREMIUM',
        templateVariant: 'elegant-gold',
        customization: {
          primaryColor: '#D4AF37',
          secondaryColor: '#FFFFFF',
          coverImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
          galleryImages: [
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
            'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6'
          ],
          giftTableUrl: 'https://amazon.com.mx/wedding-registry/juan-laura',
          additionalInfo: 'Código de vestimenta: Formal. Recepción a las 19:00 hrs.'
        }
      },
      guest: {
        id: 'guest-001',
        fullName: 'María García',
        phone: '+52 55 1234 5678',
        rsvpStatus: 'PENDING'
      }
    };

    return of(mockData);
  }

  private mockConfirmRsvp(inviteCode: string, data: RsvpData): Observable<RsvpResponse> {
    // Buscar el guest real por inviteCode
    const guest = this.mockDataService.getGuestByInviteCode(inviteCode);

    if (!guest) {
      // Si no se encuentra, retornar datos mock básicos
      const mockResponse: RsvpResponse = {
        message: 'RSVP confirmado exitosamente',
        invitation: {
          id: 'inv-001',
          inviteCode: inviteCode,
          guestCount: data.guestCount,
          status: 'DELIVERED'
        },
        guest: {
          id: 'guest-001',
          fullName: 'Invitado',
          phone: '',
          rsvpStatus: data.rsvpStatus
        },
        qrGenerated: true,
        qrToken: `qr-${inviteCode}`
      };
      return of(mockResponse);
    }

    console.log('[RSVP Debug] Creando response con guest ID:', guest.id);
    // Retornar datos del guest real
    const mockResponse: RsvpResponse = {
      message: 'RSVP confirmado exitosamente',
      invitation: {
        id: 'inv-' + guest.id,
        inviteCode: inviteCode,
        guestCount: data.guestCount,
        status: 'DELIVERED'
      },
      guest: {
        id: guest.id,
        fullName: guest.fullName,
        phone: guest.phone,
        rsvpStatus: data.rsvpStatus
      },
      qrGenerated: true,
      qrToken: `qr-${inviteCode}`
    };

    return of(mockResponse);
  }

  private getMockQrCode(inviteCode: string): Observable<QrData> {
    const mockQr: QrData = {
      qrToken: `qr-${inviteCode}`,
      qrDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      isActive: true
    };

    return of(mockQr);
  }

  private getMockCalendar(inviteCode: string): Observable<Blob> {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20250615T180000Z
DTEND:20250615T230000Z
SUMMARY:Boda de Juan y Laura
LOCATION:Jardín Botánico de la Ciudad
DESCRIPTION:Código de vestimenta: Formal
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    return of(blob);
  }

  /**
   * Guardar archivo de calendario
   */
  saveCalendarFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
