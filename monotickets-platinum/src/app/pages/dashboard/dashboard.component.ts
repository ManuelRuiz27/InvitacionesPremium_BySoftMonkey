import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventsService, Event, EventStats } from '../../core/services/events.service';

interface EventSummary {
    id: string;
    name: string;
    date: Date;
    location: string;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'BLOCKED';
    stats: {
        totalGuests: number;
        confirmedGuests: number;
        attendedGuests: number;
        deliveryRate: number;
        rsvpRate: number;
    };
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatIconModule,
        MatTooltipModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
    events: EventSummary[] = [];
    isLoading = true;
    error: string | null = null;
    activeFilter: 'all' | 'active' | 'closed' = 'all';
    private destroy$ = new Subject<void>();

    constructor(private eventsService: EventsService) { }

    ngOnInit(): void {
        this.loadEvents();
        this.setupAutoRefresh();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    setupAutoRefresh(): void {
        // Auto-refresh every 30 seconds
        interval(30000)
            .pipe(
                startWith(0),
                switchMap(() => this.eventsService.getEvents()),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (events) => this.processEvents(events),
                error: (error) => this.handleError(error)
            });
    }

    loadEvents(): void {
        this.isLoading = true;
        this.error = null;

        this.eventsService.getEvents()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (events) => this.processEvents(events),
                error: (error) => this.handleError(error)
            });
    }

    processEvents(events: Event[]): void {
        if (events.length === 0) {
            this.events = [];
            this.isLoading = false;
            return;
        }

        // Load stats for each event
        const statsRequests = events.map(event =>
            this.eventsService.getEventStats(event.id)
        );

        forkJoin(statsRequests).subscribe({
            next: (stats) => {
                this.events = events.map((event, index) => ({
                    id: event.id,
                    name: event.name,
                    date: new Date(event.date),
                    location: event.location || 'Sin ubicación',
                    status: event.status,
                    stats: {
                        totalGuests: stats[index].totalGuests,
                        confirmedGuests: stats[index].confirmedGuests,
                        attendedGuests: stats[index].totalScans,
                        deliveryRate: stats[index].deliveryRate,
                        rsvpRate: stats[index].rsvpRate,
                    },
                }));
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading stats:', error);
                // Fallback to events without stats
                this.events = events.map(event => ({
                    id: event.id,
                    name: event.name,
                    date: new Date(event.date),
                    location: event.location || 'Sin ubicación',
                    status: event.status,
                    stats: {
                        totalGuests: 0,
                        confirmedGuests: 0,
                        attendedGuests: 0,
                        deliveryRate: 0,
                        rsvpRate: 0,
                    },
                }));
                this.isLoading = false;
            }
        });
    }

    handleError(error: any): void {
        console.error('Error loading events:', error);
        this.error = 'Error al cargar los eventos. Por favor, intenta de nuevo.';
        this.isLoading = false;
    }

    refresh(): void {
        this.loadEvents();
    }

    getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
        switch (status) {
            case 'PUBLISHED':
                return 'success';
            case 'BLOCKED':
                return 'error';
            default:
                return 'default';
        }
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            DRAFT: 'Borrador',
            PUBLISHED: 'Publicado',
            CLOSED: 'Cerrado',
            BLOCKED: 'Bloqueado',
        };
        return labels[status] || status;
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-green-100';
            case 'BLOCKED':
                return 'bg-red-100';
            case 'CLOSED':
                return 'bg-gray-100';
            default:
                return 'bg-gray-100';
        }
    }

    get filteredEvents(): EventSummary[] {
        if (this.activeFilter === 'all') {
            return this.events;
        }
        if (this.activeFilter === 'active') {
            return this.events.filter(e => e.status === 'PUBLISHED');
        }
        return this.events.filter(e => e.status === 'CLOSED');
    }

    setFilter(filter: 'all' | 'active' | 'closed'): void {
        this.activeFilter = filter;
    }

    get activeEventsCount(): number {
        return this.events.filter(e => e.status === 'PUBLISHED').length;
    }

    get closedEventsCount(): number {
        return this.events.filter(e => e.status === 'CLOSED').length;
    }

    get maxEventsReached(): boolean {
        return this.activeEventsCount >= 5;
    }
}
