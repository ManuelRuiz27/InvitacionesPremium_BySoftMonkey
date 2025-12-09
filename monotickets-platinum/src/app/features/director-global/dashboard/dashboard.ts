import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { DirectorService, GlobalMetrics } from '../services/director.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  metrics: GlobalMetrics | null = null;
  loading = true;
  filterForm!: FormGroup;

  // Chart configuration
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Eventos', 'Invitaciones', 'Confirmaciones', 'Escaneos'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        label: 'Métricas Globales',
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(236, 72, 153)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 2
      }
    ]
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  constructor(
    private directorService: DirectorService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null]
    });

    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading = true;
    const { startDate, endDate } = this.filterForm.value;

    this.directorService.getGlobalMetrics(startDate, endDate).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.updateChartData(metrics);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading metrics:', error);
        this.loading = false;
      }
    });
  }

  updateChartData(metrics: GlobalMetrics): void {
    this.barChartData.datasets[0].data = [
      metrics.totalEvents,
      metrics.totalInvitations,
      metrics.totalConfirmations,
      metrics.totalScans
    ];
  }

  applyFilter(): void {
    this.loadMetrics();
  }

  clearFilter(): void {
    this.filterForm.reset();
    this.loadMetrics();
  }

  navigateToPlanners(): void {
    this.router.navigate(['/director/planners']);
  }

  navigateToEvents(): void {
    this.router.navigate(['/director/events']);
  }

  logout(): void {
    this.authService.logout();
  }
}
