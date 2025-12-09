import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DirectorService, PlannerMetrics } from '../services/director.service';

@Component({
  selector: 'app-planner-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './planner-detail.html',
  styleUrl: './planner-detail.scss'
})
export class PlannerDetail implements OnInit {
  plannerMetrics: PlannerMetrics | null = null;
  loading = true;
  plannerId: string = '';

  constructor(
    private directorService: DirectorService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.plannerId = this.route.snapshot.paramMap.get('id') || '';
    if (this.plannerId) {
      this.loadPlannerMetrics();
    }
  }

  loadPlannerMetrics(): void {
    this.loading = true;
    this.directorService.getPlannerMetrics(this.plannerId).subscribe({
      next: (metrics) => {
        this.plannerMetrics = metrics;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading planner metrics:', error);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/director/planners']);
  }
}
