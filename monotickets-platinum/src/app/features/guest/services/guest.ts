import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PremiumEffect = 'FLIPBOOK' | 'PERGAMINO';

export interface PremiumInvitationConfig {
  effect?: PremiumEffect;
  reduceMotion?: boolean;
  palette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };
  cover?: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
  };
  story?: {
    text?: string;
    photoUrls?: string[];
  };
  gallery?: {
    enabled?: boolean;
    imageUrls?: string[];
  };
  location?: {
    enabled?: boolean;
    address?: string;
    mapUrl?: string;
  };
  infoBlocks?: Array<{
    title?: string;
    details?: string;
  }>;
  rsvp?: {
    message?: string;
    buttonLabel?: string;
  };
  access?: {
    placeholder?: string;
  };
  updatedAt?: string;
}

export interface InvitationData {
  invitation: {
    id: string;
    inviteCode: string;
    guestCount: number;
    inviteType: string;
    landingUrl: string;
    pdfUrl?: string;
    status: string;
    createdAt?: string;
    sentAt?: string;
    deliveredAt?: string;
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
    eventAt?: string;
    venueText?: string;
    description?: string;
    customization?: {
      primaryColor: string;
      secondaryColor: string;
      coverImageUrl?: string;
      galleryImages?: string[];
      giftTableUrl?: string;
      additionalInfo?: string;
    };
    premiumConfig?: PremiumInvitationConfig;
  };
  guest: {
    id: string;
    fullName: string;
    phone: string;
    rsvpStatus: string;
    guestCount?: number;
  };
}

export type InvitationAccessStatus = 'LOCKED' | 'UNLOCKED' | 'EXPIRED' | 'BLOCKED' | 'DECLINED' | 'PENDING';

export interface InvitationAccess {
  status: InvitationAccessStatus;
  message: string;
  qrToken?: string;
  validFrom?: string;
  validUntil?: string;
  guestCapacity?: number;
  remainingGuests?: number;
  allowCalendar?: boolean;
  lastUpdated?: string;
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
  private guestApiUrl = `${environment.apiUrl}/guest`;
  private publicInviteApiUrl = `${environment.apiUrl}/public/invite`;

  constructor(private http: HttpClient) { }

  getInvitationByCode(inviteCode: string): Observable<InvitationData> {
    return this.http.get<InvitationData>(`${this.guestApiUrl}/invitation/${inviteCode}`);
  }

  confirmRsvp(inviteCode: string, data: RsvpData): Observable<RsvpResponse> {
    return this.http.post<RsvpResponse>(`${this.guestApiUrl}/rsvp/${inviteCode}`, data);
  }

  getQrCode(inviteCode: string): Observable<QrData> {
    return this.http.get<QrData>(`${this.guestApiUrl}/qr/${inviteCode}`);
  }

  downloadCalendar(inviteCode: string, reminders: string[] = []): Observable<Blob> {
    const body = reminders.length ? { reminders } : {};
    return this.http.post(`${this.publicInviteApiUrl}/${inviteCode}/calendar/ics`, body, { responseType: 'blob' });
  }

  getMemoryView(inviteCode: string): Observable<any> {
    return this.http.get(`${this.publicInviteApiUrl}/${inviteCode}/memory`);
  }

  downloadMemoryPdf(inviteCode: string): Observable<Blob> {
    return this.http.get(`${this.publicInviteApiUrl}/${inviteCode}/memory.pdf`, { responseType: 'blob' });
  }

  getInvitationAccess(inviteCode: string): Observable<InvitationAccess> {
    return this.http.get<InvitationAccess>(`${this.publicInviteApiUrl}/${inviteCode}/access`);
  }

  saveCalendarFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
