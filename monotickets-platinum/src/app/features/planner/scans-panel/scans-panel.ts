import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Subscription } from 'rxjs';

import { ScansService, type Scan, type AttendanceStats } from '../services/scans.service';

@Component({
    selector: 'app-scans-panel',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule
    ],
    templateUrl: './scans-panel.html',
    styleUrl: './scans-panel.scss'
})
export class ScansPanel implements OnInit, OnDestroy {
    eventId: string = '';

    loading = true;
    scans: Scan[] = [];
    filteredScans: Scan[] = [];
    stats: AttendanceStats | null = null;
    filter: 'all' | 'valid' | 'duplicate' | 'invalid' = 'all';
    displayedColumns: string[] = ['guestName', 'guestCount', 'scannedAt', 'result', 'staff'];

    private scansSubscription?: Subscription;

    constructor(
        private scansService: ScansService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
        if (this.eventId) {
            this.loadScans();
            this.loadStats();
            this.startRealtime();
        }
    }

    ngOnDestroy(): void {
        this.scansSubscription?.unsubscribe();
    }

    loadScans(): void {
        this.loading = true;
        this.scansService.getScans(this.eventId).subscribe({
            next: (scans) => {
                this.scans = scans;
                this.applyFilter();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading scans:', err);
                this.loading = false;
            }
        });
    }

    loadStats(): void {
        this.scansService.getAttendanceStats(this.eventId).subscribe({
            next: (stats) => {
                this.stats = stats;
            },
            error: (err) => {
                console.error('Error loading stats:', err);
            }
        });
    }

    startRealtime(): void {
        this.scansSubscription = this.scansService.getScansRealtime(this.eventId).subscribe({
            next: (scans) => {
                this.scans = scans;
                this.applyFilter();
                this.loadStats();
            }
        });
    }

    applyFilter(): void {
        switch (this.filter) {
            case 'valid':
                this.filteredScans = this.scans.filter(s => s.scanResult === 'VALID');
                break;
            case 'duplicate':
                this.filteredScans = this.scans.filter(s => s.scanResult === 'DUPLICATE');
                break;
            case 'invalid':
                this.filteredScans = this.scans.filter(s => s.scanResult === 'EXPIRED' || s.scanResult === 'INVALID');
                break;
            default:
                this.filteredScans = this.scans;
        }
    }

    onFilterChange(filter: 'all' | 'valid' | 'duplicate' | 'invalid'): void {
        this.filter = filter;
        this.applyFilter();
    }

    exportCSV(): void {
        this.scansService.exportScansCSV(this.eventId).subscribe({
            next: (blob) => {
                this.scansService.saveCSVFile(blob, `escaneos-${this.eventId}.csv`);
            },
            error: (err) => {
                console.error('Error exporting CSV:', err);
                alert('Error al exportar CSV');
            }
        });
    }

    getResultColor(result: string): string {
        switch (result) {
            case 'VALID': return 'success';
            case 'DUPLICATE': return 'warning';
            case 'EXPIRED':
            case 'INVALID': return 'error';
            default: return 'default';
        }
    }

    getResultIcon(result: string): string {
        switch (result) {
            case 'VALID': return 'check_circle';
            case 'DUPLICATE': return 'content_copy';
            case 'EXPIRED': return 'schedule';
            case 'INVALID': return 'error';
            default: return 'help';
        }
    }

    formatDateTime(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getValidCount(): number {
        return this.scans.filter(s => s.scanResult === 'VALID').length;
    }

    getDuplicateCount(): number {
        return this.scans.filter(s => s.scanResult === 'DUPLICATE').length;
    }

    getInvalidCount(): number {
        return this.scans.filter(s => s.scanResult === 'EXPIRED' || s.scanResult === 'INVALID').length;
    }

    goBack(): void {
        if (this.eventId) {
            this.router.navigate(['/planner/events', this.eventId]);
        }
    }
}
