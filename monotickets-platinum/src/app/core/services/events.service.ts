import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Event {
    id: string;
    name: string;
    date: string;
    location: string | null;
    description: string | null;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'BLOCKED';
    plannerId: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string | null;
    closedAt?: string | null;
    blockedReason?: string | null;
    maxGuests: number;
    maxInvitations: number;
}

export interface EventStats {
    totalGuests: number;
    confirmedGuests: number;
    declinedGuests: number;
    pendingGuests: number;
    totalInvitations: number;
    deliveredInvitations: number;
    failedInvitations: number;
    deliveryRate: number;
    rsvpRate: number;
    totalScans: number;
    attendanceRate: number;
}

export interface CreateEventDto {
    name: string;
    date: string;
    location?: string;
    description?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    private apiUrl = `${environment.apiUrl}/events`;

    constructor(private http: HttpClient) { }

    /**
     * Get all events for current planner
     */
    getEvents(params?: { status?: string }): Observable<Event[]> {
        let httpParams = new HttpParams();
        if (params?.status) {
            httpParams = httpParams.set('status', params.status);
        }
        return this.http.get<Event[]>(this.apiUrl, { params: httpParams });
    }

    /**
     * Get single event by ID
     */
    getEvent(id: string): Observable<Event> {
        return this.http.get<Event>(`${this.apiUrl}/${id}`);
    }

    /**
     * Get event statistics
     */
    getEventStats(id: string): Observable<EventStats> {
        return this.http.get<EventStats>(`${this.apiUrl}/${id}/stats`);
    }

    /**
     * Create new event (DRAFT status)
     */
    createEvent(data: CreateEventDto): Observable<Event> {
        return this.http.post<Event>(this.apiUrl, data);
    }

    /**
     * Update event
     */
    updateEvent(id: string, data: Partial<CreateEventDto>): Observable<Event> {
        return this.http.patch<Event>(`${this.apiUrl}/${id}`, data);
    }

    /**
     * Publish event
     */
    publishEvent(id: string): Observable<Event> {
        return this.http.post<Event>(`${this.apiUrl}/${id}/publish`, {});
    }

    /**
     * Close event
     */
    closeEvent(id: string): Observable<Event> {
        return this.http.post<Event>(`${this.apiUrl}/${id}/close`, {});
    }

    /**
     * Delete event
     */
    deleteEvent(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
