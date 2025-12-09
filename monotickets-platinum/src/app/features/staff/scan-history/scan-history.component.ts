import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScannerService, ScanHistoryItem } from '../services/scanner.service';

type FilterType = 'ALL' | 'VALID' | 'DUPLICATE' | 'INVALID';

@Component({
    selector: 'app-scan-history',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule
    ],
    templateUrl: './scan-history.component.html',
    styleUrls: ['./scan-history.component.scss']
})
export class ScanHistoryComponent implements OnInit {
    allScans: ScanHistoryItem[] = [];
    filteredScans: ScanHistoryItem[] = [];
    searchTerm = '';
    activeFilter: FilterType = 'ALL';

    // Statistics
    totalScans = 0;
    validScans = 0;
    duplicateScans = 0;
    invalidScans = 0;

    constructor(
        private router: Router,
        private scannerService: ScannerService
    ) { }

    ngOnInit(): void {
        this.loadHistory();
        this.calculateStats();
    }

    loadHistory(): void {
        const stored = localStorage.getItem('scanHistory');
        if (stored) {
            try {
                const history = JSON.parse(stored);
                this.allScans = history.map((item: any) => ({
                    id: item.id || this.generateId(),
                    qrToken: item.qrToken || 'unknown',
                    eventId: '1',
                    guestId: item.guestId,
                    guestName: item.guestName,
                    guestCount: item.guestCount,
                    status: item.status,
                    scannedAt: new Date(item.scannedAt),
                    scannedBy: 'staff-1',
                    synced: true
                }));
            } catch (e) {
                console.error('Error loading history:', e);
                this.allScans = [];
            }
        }

        this.applyFilters();
    }

    applyFilters(): void {
        let filtered = [...this.allScans];

        if (this.activeFilter !== 'ALL') {
            filtered = filtered.filter(scan => scan.status === this.activeFilter);
        }

        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(scan =>
                scan.guestName?.toLowerCase().includes(term) ||
                scan.qrToken.toLowerCase().includes(term)
            );
        }

        this.filteredScans = filtered;
    }

    calculateStats(): void {
        this.totalScans = this.allScans.length;
        this.validScans = this.allScans.filter(s => s.status === 'VALID').length;
        this.duplicateScans = this.allScans.filter(s => s.status === 'DUPLICATE').length;
        this.invalidScans = this.allScans.filter(s => s.status === 'INVALID' || s.status === 'EXPIRED').length;
    }

    setFilter(filter: FilterType): void {
        this.activeFilter = filter;
        this.applyFilters();
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    exportToCSV(): void {
        if (this.filteredScans.length === 0) {
            alert('No hay escaneos para exportar');
            return;
        }

        const headers = ['Fecha/Hora', 'Invitado', 'Personas', 'Estado', 'QR Token'];
        const rows = this.filteredScans.map(scan => [
            this.formatDateTime(scan.scannedAt),
            scan.guestName || 'N/A',
            scan.guestCount?.toString() || 'N/A',
            scan.status,
            scan.qrToken
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `scan-history-${Date.now()}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    clearHistory(): void {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
            localStorage.removeItem('scanHistory');
            this.allScans = [];
            this.filteredScans = [];
            this.calculateStats();
        }
    }

    goBack(): void {
        this.router.navigate(['/staff/scanner']);
    }

    private generateId(): string {
        return 'scan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatDateTime(date: Date): string {
        return new Date(date).toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    formatTime(date: Date): string {
        return new Date(date).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'VALID': return 'check_circle';
            case 'DUPLICATE': return 'warning';
            case 'INVALID':
            case 'EXPIRED': return 'cancel';
            default: return 'help';
        }
    }

    getStatusClass(status: string): string {
        return `status-${status.toLowerCase()}`;
    }
}
