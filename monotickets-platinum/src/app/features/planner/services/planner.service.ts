import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { type Event, EventType } from '../../../core/models';
import { MockDataService } from '../../../core/services/mock-data.service';

export interface PlannerDashboardMetrics {
    totalEvents: number;
    totalInvitations: number;
    totalConfirmations: number;
    confirmationRate: number;
    eventsByType: { type: EventType; count: number }[];
}

export interface CreateEventDto {
    name: string;
    type: EventType;
    date: Date;
    time: string;
    locationText: string;
    locationLat?: number;
    locationLng?: number;
    templateType: 'PREMIUM' | 'PDF';
    templateVariant?: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> { }

export interface Template {
    id: string;
    name: string;
    type: 'PREMIUM' | 'PDF';
    description: string;
    previewUrl: string;
}

export interface TemplateVariant {
    id: string;
    name: string;
    templateId: string;
    previewUrl: string;
    colorScheme: string;
}

@Injectable({
    providedIn: 'root'
})
export class PlannerService {
    private apiUrl = `${environment.apiUrl}/planner`;
    private useMockData = true; // Toggle to switch between mock and real API

    constructor(
        private http: HttpClient,
        private mockDataService: MockDataService
    ) { }

    // Dashboard metrics
    getDashboardMetrics(): Observable<PlannerDashboardMetrics> {
        if (this.useMockData) {
            return this.mockDataService.getPlannerDashboardMetrics();
        }

        return this.http.get<PlannerDashboardMetrics>(`${this.apiUrl}/metrics`);
    }

    // Get my events
    getMyEvents(page: number = 1, limit: number = 10, filters?: any): Observable<{ events: Event[], total: number }> {
        if (this.useMockData) {
            return this.mockDataService.getMyEvents(page, limit, filters);
        }

        let params: any = { page: page.toString(), limit: limit.toString() };
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) params[key] = filters[key];
            });
        }

        return this.http.get<{ events: Event[], total: number }>(`${this.apiUrl}/events`, { params });
    }

    // Get event by ID
    getEventById(id: string): Observable<Event> {
        if (this.useMockData) {
            return this.mockDataService.getEventById(id).pipe(
                map(event => {
                    if (!event) {
                        throw new Error('Event not found');
                    }
                    return event;
                })
            );
        }

        return this.http.get<Event>(`${this.apiUrl}/events/${id}`);
    }

    // Create event
    createEvent(eventData: CreateEventDto): Observable<Event> {
        if (this.useMockData) {
            return this.mockDataService.createEvent(eventData);
        }

        return this.http.post<Event>(`${this.apiUrl}/events`, eventData);
    }

    // Update event
    updateEvent(id: string, eventData: UpdateEventDto): Observable<Event> {
        if (this.useMockData) {
            return this.mockDataService.updateEvent(id, eventData);
        }

        return this.http.put<Event>(`${this.apiUrl}/events/${id}`, eventData);
    }

    // Delete event
    deleteEvent(id: string): Observable<void> {
        if (this.useMockData) {
            return this.mockDataService.deleteEvent(id);
        }

        return this.http.delete<void>(`${this.apiUrl}/events/${id}`);
    }

    // Get templates
    getTemplates(): Observable<Template[]> {
        if (this.useMockData) {
            return this.mockDataService.getTemplates();
        }

        return this.http.get<Template[]>(`${this.apiUrl}/templates`);
    }

    // Get template variants
    getTemplateVariants(templateType: string): Observable<TemplateVariant[]> {
        if (this.useMockData) {
            return this.mockDataService.getTemplateVariants(templateType);
        }

        return this.http.get<TemplateVariant[]>(`${this.apiUrl}/templates/${templateType}/variants`);
    }

    // Get upcoming events
    getUpcomingEvents(limit: number = 5): Observable<Event[]> {
        if (this.useMockData) {
            return this.mockDataService.getUpcomingEvents(limit);
        }

        return this.http.get<Event[]>(`${this.apiUrl}/events/upcoming`, { params: { limit: limit.toString() } });
    }
}
