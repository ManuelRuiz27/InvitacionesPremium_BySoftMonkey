import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Guest {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    guestCount: number;
    eventId: string;
    rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
    respondedAt: Date | null;
}

export interface ImportResult {
    created: number;
    skipped: number;
    invalid: number;
    errors: ImportError[];
}

export interface ImportError {
    row: number;
    field: string;
    value: string;
    reason: string;
}

@Injectable({
    providedIn: 'root'
})
export class GuestsService {
    private apiUrl = `${environment.apiUrl}/events`;

    constructor(private http: HttpClient) { }

    /**
     * Get all guests for an event
     */
    getGuests(eventId: string): Observable<Guest[]> {
        return this.http.get<Guest[]>(`${this.apiUrl}/${eventId}/guests`);
    }

    /**
     * Import guests from CSV file
     */
    importGuests(eventId: string, file: File): Observable<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ImportResult>(`${this.apiUrl}/${eventId}/guests/import`, formData);
    }

    /**
     * Download CSV template
     */
    downloadTemplate(eventId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${eventId}/guests/import/template`, {
            responseType: 'blob'
        });
    }

    /**
     * Delete a guest
     */
    deleteGuest(eventId: string, guestId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${eventId}/guests/${guestId}`);
    }
}
