import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Event } from '../../../core/models';

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

    constructor(
        private http: HttpClient
    ) { }

    // Get global metrics
    getGlobalMetrics(startDate?: Date, endDate?: Date): Observable<GlobalMetrics> {
        let params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        return this.http.get<GlobalMetrics>(`${this.apiUrl}/metrics`, { params });
    }

    // Get all planners
    getPlanners(page: number = 1, limit: number = 10): Observable<{ planners: PlannerListItem[], total: number }> {
        return this.http.get<{ planners: PlannerListItem[], total: number }>(
            `${this.apiUrl}/planners`,
            { params: { page: page.toString(), limit: limit.toString() } }
        );
    }

    // Get planner details with metrics
    getPlannerMetrics(plannerId: string): Observable<PlannerMetrics> {
        return this.http.get<PlannerMetrics>(`${this.apiUrl}/planners/${plannerId}/metrics`);
    }

    // Get all events (global)
    getAllEvents(page: number = 1, limit: number = 10, plannerId?: string): Observable<{ events: Event[], total: number }> {
        let params: any = { page: page.toString(), limit: limit.toString() };
        if (plannerId) params.plannerId = plannerId;

        return this.http.get<{ events: Event[], total: number }>(`${this.apiUrl}/events`, { params });
    }
}
