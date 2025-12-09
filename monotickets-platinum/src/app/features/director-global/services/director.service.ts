import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, Event } from '../../../core/models';
import { MockDataService } from '../../../core/services/mock-data.service';

export interface GlobalMetrics {
    totalEvents: number;
    totalInvitations: number;
    totalConfirmations: number;
    totalScans: number;
}

export interface PlannerMetrics {
    plannerId: string;
    plannerName: string;
    orgName: string;
    totalEvents: number;
    totalInvitations: number;
    totalConfirmations: number;
    totalScans: number;
}

export interface PlannerListItem {
    id: string;
    name: string;
    email: string;
    orgName: string;
    totalEvents: number;
    createdAt: Date;
}

@Injectable({
    providedIn: 'root'
})
export class DirectorService {
    private apiUrl = `${environment.apiUrl}/director`;
    private useMockData = true; // Toggle to switch between mock and real API

    constructor(
        private http: HttpClient,
        private mockDataService: MockDataService
    ) { }

    // Get global metrics
    getGlobalMetrics(startDate?: Date, endDate?: Date): Observable<GlobalMetrics> {
        if (this.useMockData) {
            return this.mockDataService.getGlobalMetrics();
        }

        let params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        return this.http.get<GlobalMetrics>(`${this.apiUrl}/metrics`, { params });
    }

    // Get all planners
    getPlanners(page: number = 1, limit: number = 10): Observable<{ planners: PlannerListItem[], total: number }> {
        if (this.useMockData) {
            return this.mockDataService.getPlannersList(page, limit);
        }

        return this.http.get<{ planners: PlannerListItem[], total: number }>(
            `${this.apiUrl}/planners`,
            { params: { page: page.toString(), limit: limit.toString() } }
        );
    }

    // Get planner details with metrics
    getPlannerMetrics(plannerId: string): Observable<PlannerMetrics> {
        if (this.useMockData) {
            return this.mockDataService.getPlannerMetrics(plannerId);
        }

        return this.http.get<PlannerMetrics>(`${this.apiUrl}/planners/${plannerId}/metrics`);
    }

    // Get all events (global)
    getAllEvents(page: number = 1, limit: number = 10, plannerId?: string): Observable<{ events: Event[], total: number }> {
        if (this.useMockData) {
            return this.mockDataService.getEvents().pipe(
                map(events => {
                    let filteredEvents = events;
                    if (plannerId) {
                        filteredEvents = events.filter(e => e.plannerId === plannerId);
                    }

                    const start = (page - 1) * limit;
                    const end = start + limit;

                    return {
                        events: filteredEvents.slice(start, end),
                        total: filteredEvents.length
                    };
                })
            );
        }

        let params: any = { page: page.toString(), limit: limit.toString() };
        if (plannerId) params.plannerId = plannerId;

        return this.http.get<{ events: Event[], total: number }>(`${this.apiUrl}/events`, { params });
    }
}
