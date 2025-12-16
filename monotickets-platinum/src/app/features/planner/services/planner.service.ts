import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { type Event, EventType, TemplateType } from '../../../core/models';

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
    guestCountDefault?: number;
    allowPartialEntry?: boolean;
}

export interface UpdateEventDto extends Partial<CreateEventDto> { }

export interface Template {
    id: string;
    name: string;
    type: 'PREMIUM' | 'PDF';
    description: string;
    previewUrl: string;
    category?: EventType;
}

export interface TemplateVariant {
    id: string;
    name: string;
    templateId: string;
    previewUrl: string;
    colorScheme: string;
}

export interface GeneratedLinkResponse {
    publicUrl: string;
    token?: string;
    expiresAt?: string;
}

export interface EventStats {
    invitationsGenerated: number;
    confirmations: number;
    pending: number;
    declined: number;
    scanned: number;
    deliverySuccessRate?: number;
    rsvpRate?: number;
}

export interface EventMetricsSummary {
    eventId: string;
    deliveryRate: number;
    rsvpRate: number;
    showUpRate: number;
    avgTimeToRsvp: number;
    totalEntered: number;
    expectedTotal: number;
}

export interface QrPlacement {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}

export interface PdfTemplateConfig {
    templateId: string;
    previewUrl: string;
    pdfUrl?: string;
    totalPages: number;
    qrPlacement?: QrPlacement;
}

export type PremiumEffect = 'FLIPBOOK' | 'PERGAMINO';

export interface PremiumPalette {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
}

export interface PremiumInfoBlock {
    title: string;
    details: string;
}

export interface PremiumConfig {
    effect: PremiumEffect;
    reduceMotion: boolean;
    palette: PremiumPalette;
    cover: {
        title: string;
        subtitle?: string;
        imageUrl?: string;
    };
    story: {
        text?: string;
        photoUrls: string[];
    };
    gallery: {
        enabled: boolean;
        imageUrls: string[];
    };
    location: {
        enabled: boolean;
        address?: string;
        mapUrl?: string;
    };
    infoBlocks: PremiumInfoBlock[];
    rsvp: {
        message: string;
        buttonLabel: string;
    };
    access: {
        placeholder: string;
    };
    updatedAt?: string;
}

export interface PlannerBrandDefaults {
    logoMediaId?: string;
    logoUrl?: string;
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
    };
    contactEmail?: string;
    contactPhone?: string;
}

export interface PlannerSettings {
    id: string;
    brandDefaults: PlannerBrandDefaults | null;
    preferredInviteMode: TemplateType;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PlannerService {
    private apiUrl = `${environment.apiUrl}/planner`;
    private exportsUrl = `${environment.apiUrl}/exports`;
    private metricsUrl = `${environment.apiUrl}/metrics`;
    private plannersUrl = `${environment.apiUrl}/planners`;

    constructor(
        private http: HttpClient
    ) { }

    // Dashboard metrics
    getDashboardMetrics(): Observable<PlannerDashboardMetrics> {
        return this.http.get<PlannerDashboardMetrics>(`${this.apiUrl}/metrics`);
    }

    // Get my events
    getMyEvents(page: number = 1, limit: number = 10, filters?: any): Observable<{ events: Event[], total: number }> {
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
        return this.http.get<Event>(`${this.apiUrl}/events/${id}`);
    }

    // Create event
    createEvent(eventData: CreateEventDto): Observable<Event> {
        return this.http.post<Event>(`${this.apiUrl}/events`, eventData);
    }

    // Update event
    updateEvent(id: string, eventData: UpdateEventDto): Observable<Event> {
        return this.http.put<Event>(`${this.apiUrl}/events/${id}`, eventData);
    }

    // Delete event
    deleteEvent(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/events/${id}`);
    }

    // Get templates
    getTemplates(): Observable<Template[]> {
        return this.http.get<Template[]>(`${this.apiUrl}/templates`);
    }

    // Get template variants
    getTemplateVariants(templateType: string): Observable<TemplateVariant[]> {
        return this.http.get<TemplateVariant[]>(`${this.apiUrl}/templates/${templateType}/variants`);
    }

    // Get upcoming events
    getUpcomingEvents(limit: number = 5): Observable<Event[]> {
        return this.http.get<Event[]>(`${this.apiUrl}/events/upcoming`, { params: { limit: limit.toString() } });
    }

    // Generate RSVP link
    generateRsvpLink(eventId: string): Observable<GeneratedLinkResponse> {
        return this.http.post<GeneratedLinkResponse>(`${this.apiUrl}/events/${eventId}/forms/rsvp`, {});
    }

    // Generate host link
    generateHostLink(eventId: string): Observable<GeneratedLinkResponse> {
        return this.http.post<GeneratedLinkResponse>(`${this.apiUrl}/events/${eventId}/forms/hosts`, {});
    }

    getEventStats(eventId: string): Observable<EventStats> {
        return this.http.get<EventStats>(`${this.apiUrl}/events/${eventId}/stats`);
    }

    getEventMetrics(eventId: string): Observable<EventMetricsSummary> {
        return this.http.get<EventMetricsSummary>(`${this.metricsUrl}/events/${eventId}`);
    }

    selectPdfTemplate(eventId: string, templateId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/events/${eventId}/pdf-template/select`, { templateId });
    }

    uploadPdfTemplate(eventId: string, file: File): Observable<{ templateId: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ templateId: string }>(`${this.apiUrl}/events/${eventId}/pdf-template/upload`, formData);
    }

    getPdfTemplate(eventId: string): Observable<PdfTemplateConfig> {
        return this.http.get<PdfTemplateConfig>(`${this.apiUrl}/events/${eventId}/pdf-template`);
    }

    updateQrPlacement(eventId: string, placement: QrPlacement): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/events/${eventId}/pdf-template/qr-placement`, placement);
    }

    getPremiumConfig(eventId: string): Observable<PremiumConfig> {
        return this.http.get<PremiumConfig>(`${this.apiUrl}/events/${eventId}/premium-config`);
    }

    updatePremiumConfig(eventId: string, config: PremiumConfig): Observable<PremiumConfig> {
        return this.http.patch<PremiumConfig>(`${this.apiUrl}/events/${eventId}/premium-config`, config);
    }

    exportGuestsList(eventId: string, format: 'csv' | 'xlsx' = 'csv'): Observable<Blob> {
        const params = new HttpParams().set('format', format);
        return this.http.get(`${this.exportsUrl}/guests/${eventId}`, {
            params,
            responseType: 'blob'
        });
    }

    getPlannerSettings(): Observable<PlannerSettings> {
        return this.http.get<PlannerSettings>(`${this.plannersUrl}/me/settings`);
    }

    updatePlannerSettings(payload: Partial<{ brandDefaults: PlannerBrandDefaults | null; preferredInviteMode: TemplateType; }>): Observable<PlannerSettings> {
        return this.http.patch<PlannerSettings>(`${this.plannersUrl}/me/settings`, payload);
    }
}
