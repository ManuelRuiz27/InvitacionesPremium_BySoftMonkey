import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { PlannerService, PlannerDashboardMetrics } from '../services/planner.service';
import { type Event, EventType } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-planner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class PlannerDashboard implements OnInit {
  metrics: PlannerDashboardMetrics | null = null;
  upcomingEvents: Event[] = [];
  loading = true;
  userName = '';

  // Donut chart configuration
  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#667eea',
        '#f093fb',
        '#4facfe',
        '#43e97b',
        '#fa709a',
        '#feca57',
        '#48dbfb',
        '#ff6b6b'
      ],
      borderWidth: 0
    }]
  };

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value} eventos`;
          }
        }
      }
    }
  };

  constructor(
    private plannerService: PlannerService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userName = this.authService.currentUserValue?.fullName || 'Planner';
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    // Load metrics
    this.plannerService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.updateChart(metrics.eventsByType);
      },
      error: (error) => {
        console.error('Error loading metrics:', error);
        this.loading = false;
      }
    });

    // Load upcoming events
    this.plannerService.getUpcomingEvents(5).subscribe({
      next: (events) => {
        this.upcomingEvents = events;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading upcoming events:', error);
        this.loading = false;
      }
    });
  }

  updateChart(eventsByType: { type: EventType; count: number }[]): void {
    this.doughnutChartData.labels = eventsByType.map(item => this.getTypeLabel(item.type));
    this.doughnutChartData.datasets[0].data = eventsByType.map(item => item.count);
  }

  getTypeLabel(type: EventType): string {
    const labels: Record<EventType, string> = {
      [EventType.BODA]: 'Bodas',
      [EventType.XV]: 'XV Años',
      [EventType.GRADUACION]: 'Graduaciones',
      [EventType.BAUTIZO]: 'Bautizos',
      [EventType.BABY_SHOWER]: 'Baby Showers',
      [EventType.ANIVERSARIO]: 'Aniversarios',
      [EventType.COMUNION]: 'Comuniones',
      [EventType.SOCIAL]: 'Eventos Sociales'
    };
    return labels[type] || type;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  navigateToEvents(): void {
    this.router.navigate(['/planner/events']);
  }

  navigateToCreateEvent(): void {
    this.router.navigate(['/planner/events/new']);
  }

  navigateToEventDetail(eventId: string): void {
    this.router.navigate(['/planner/events', eventId]);
  }

  logout(): void {
    this.authService.logout();
  }
}
