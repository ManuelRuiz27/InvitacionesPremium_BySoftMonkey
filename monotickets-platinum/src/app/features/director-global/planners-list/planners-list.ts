import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DirectorService, PlannerListItem } from '../services/director.service';

@Component({
  selector: 'app-planners-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './planners-list.html',
  styleUrl: './planners-list.scss'
})
export class PlannersList implements OnInit {
  planners: PlannerListItem[] = [];
  displayedColumns: string[] = ['name', 'email', 'orgName', 'totalEvents', 'createdAt', 'actions'];
  loading = true;

  // Pagination
  totalPlanners = 0;
  pageSize = 10;
  currentPage = 0;

  constructor(
    private directorService: DirectorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPlanners();
  }

  loadPlanners(): void {
    this.loading = true;
    this.directorService.getPlanners(this.currentPage + 1, this.pageSize).subscribe({
      next: (response) => {
        this.planners = response.planners;
        this.totalPlanners = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading planners:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPlanners();
  }

  viewPlannerDetail(plannerId: string): void {
    this.router.navigate(['/director/planners', plannerId]);
  }

  goBack(): void {
    this.router.navigate(['/director/dashboard']);
  }
}
