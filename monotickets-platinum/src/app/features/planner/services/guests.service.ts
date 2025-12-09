import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { type Guest, type Invitation } from '../../../core/models';
import { MockDataService } from '../../../core/services/mock-data.service';

export interface GuestsResponse {
    guests: Guest[];
    total: number;
}

export interface InvitationsResponse {
    invitations: Invitation[];
    total: number;
}

export interface UploadResult {
    imported: number;
    errors: string[];
    guests: Guest[];
}

export interface GenerateResult {
    generated: number;
    invitations: Invitation[];
}

@Injectable({
    providedIn: 'root'
})
export class GuestsService {
    private apiUrl = `${environment.apiUrl}/planner`;
    private useMockData = true;

    constructor(
        private http: HttpClient,
        private mockDataService: MockDataService
    ) { }

    // Get guests for an event
    getEventGuests(eventId: string, page: number = 1, limit: number = 10, filters?: any): Observable<GuestsResponse> {
        if (this.useMockData) {
            return this.mockDataService.getEventGuests(eventId, page, limit, filters);
        }

        let params: any = { page: page.toString(), limit: limit.toString() };
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) params[key] = filters[key];
            });
        }

        return this.http.get<GuestsResponse>(`${this.apiUrl}/events/${eventId}/guests`, { params });
    }

    // Get guest by ID
    getGuestById(eventId: string, guestId: string): Observable<Guest> {
        if (this.useMockData) {
            return this.mockDataService.getGuestById(eventId, guestId);
        }

        return this.http.get<Guest>(`${this.apiUrl}/events/${eventId}/guests/${guestId}`);
    }

    // Create guest
    createGuest(eventId: string, guestData: any): Observable<Guest> {
        if (this.useMockData) {
            return this.mockDataService.createGuest(eventId, guestData);
        }

        return this.http.post<Guest>(`${this.apiUrl}/events/${eventId}/guests`, guestData);
    }

    // Update guest
    updateGuest(eventId: string, guestId: string, guestData: any): Observable<Guest> {
        if (this.useMockData) {
            return this.mockDataService.updateGuest(eventId, guestId, guestData);
        }

        return this.http.put<Guest>(`${this.apiUrl}/events/${eventId}/guests/${guestId}`, guestData);
    }

    // Delete guest
    deleteGuest(eventId: string, guestId: string): Observable<void> {
        if (this.useMockData) {
            return this.mockDataService.deleteGuest(eventId, guestId);
        }

        return this.http.delete<void>(`${this.apiUrl}/events/${eventId}/guests/${guestId}`);
    }

    // Upload CSV
    uploadGuestsCSV(eventId: string, file: File): Observable<UploadResult> {
        if (this.useMockData) {
            return this.mockDataService.uploadGuestsCSV(eventId, file);
        }

        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<UploadResult>(`${this.apiUrl}/events/${eventId}/guests/upload`, formData);
    }

    // Get invitations
    getEventInvitations(eventId: string, page: number = 1, limit: number = 10, filters?: any): Observable<InvitationsResponse> {
        if (this.useMockData) {
            return this.mockDataService.getEventInvitations(eventId, page, limit, filters);
        }

        let params: any = { page: page.toString(), limit: limit.toString() };
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) params[key] = filters[key];
            });
        }

        return this.http.get<InvitationsResponse>(`${this.apiUrl}/events/${eventId}/invitations`, { params });
    }

    // Generate invitations
    generateInvitations(eventId: string, guestIds: string[]): Observable<GenerateResult> {
        if (this.useMockData) {
            return this.mockDataService.generateInvitations(eventId, guestIds);
        }

        return this.http.post<GenerateResult>(`${this.apiUrl}/events/${eventId}/invitations/generate`, { guestIds });
    }

    // Get invitation QR
    getInvitationQR(invitationId: string): Observable<string> {
        if (this.useMockData) {
            return this.mockDataService.getInvitationQR(invitationId);
        }

        return this.http.get<string>(`${this.apiUrl}/invitations/${invitationId}/qr`);
    }

    // Resend invitation
    resendInvitation(invitationId: string): Observable<void> {
        if (this.useMockData) {
            return this.mockDataService.resendInvitation(invitationId);
        }

        return this.http.post<void>(`${this.apiUrl}/invitations/${invitationId}/resend`, {});
    }
}
