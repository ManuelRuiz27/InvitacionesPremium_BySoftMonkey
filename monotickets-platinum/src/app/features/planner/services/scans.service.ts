import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Interfaces
export interface Scan {
    id: string;
    qrTokenId: string;
    invitationId: string;
    guestId: string;
    guestName: string;
    guestCount: number;
    eventId: string;
    scannedAt: string;
    scanResult: 'VALID' | 'DUPLICATE' | 'EXPIRED' | 'INVALID';
    scannedByStaffId: string;
    scannedByStaffName: string;
}

export interface AttendanceStats {
    totalInvitations: number;
    totalGuests: number;
    scannedInvitations: number;
    scannedGuests: number;
    attendanceRate: number;
    validScans: number;
    duplicateScans: number;
    invalidScans: number;
}

@Injectable({
    providedIn: 'root'
})
export class ScansService {
    private apiUrl = `${environment.apiUrl}/scans`;
    private useMockData = true; // Cambiar a false cuando backend esté listo

    constructor(private http: HttpClient) { }

    /**
     * Obtener escaneos por evento
     */
    getScans(eventId: string): Observable<Scan[]> {
        if (this.useMockData) {
            return this.getMockScans(eventId);
        }
        return this.http.get<Scan[]>(`${this.apiUrl}/event/${eventId}`);
    }

    /**
     * Obtener escaneos en tiempo real (polling cada 10s)
     */
    getScansRealtime(eventId: string): Observable<Scan[]> {
        return interval(10000).pipe(
            startWith(0),
            switchMap(() => this.getScans(eventId))
        );
    }

    /**
     * Obtener estadísticas de asistencia
     */
    getAttendanceStats(eventId: string): Observable<AttendanceStats> {
        if (this.useMockData) {
            return this.getMockAttendanceStats(eventId);
        }
        return this.http.get<AttendanceStats>(`${this.apiUrl}/stats/${eventId}`);
    }

    /**
     * Exportar escaneos a CSV
     */
    exportScansCSV(eventId: string): Observable<Blob> {
        if (this.useMockData) {
            return this.getMockCSV(eventId);
        }
        return this.http.get(`${this.apiUrl}/export/${eventId}`, { responseType: 'blob' });
    }

    /**
     * Guardar archivo CSV
     */
    saveCSVFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    // ========== MOCK DATA METHODS ==========

    private getMockScans(eventId: string): Observable<Scan[]> {
        const scans: Scan[] = [
            {
                id: 'scan-001',
                qrTokenId: 'token-001',
                invitationId: 'inv-001',
                guestId: 'guest-001',
                guestName: 'María García',
                guestCount: 2,
                eventId: eventId,
                scannedAt: '2025-12-03T18:30:00Z',
                scanResult: 'VALID',
                scannedByStaffId: 'staff-001',
                scannedByStaffName: 'Pedro Sánchez'
            },
            {
                id: 'scan-002',
                qrTokenId: 'token-002',
                invitationId: 'inv-002',
                guestId: 'guest-002',
                guestName: 'Juan Pérez',
                guestCount: 3,
                eventId: eventId,
                scannedAt: '2025-12-03T18:32:00Z',
                scanResult: 'VALID',
                scannedByStaffId: 'staff-001',
                scannedByStaffName: 'Pedro Sánchez'
            },
            {
                id: 'scan-003',
                qrTokenId: 'token-001',
                invitationId: 'inv-001',
                guestId: 'guest-001',
                guestName: 'María García',
                guestCount: 2,
                eventId: eventId,
                scannedAt: '2025-12-03T18:35:00Z',
                scanResult: 'DUPLICATE',
                scannedByStaffId: 'staff-002',
                scannedByStaffName: 'Ana Martínez'
            },
            {
                id: 'scan-004',
                qrTokenId: 'token-003',
                invitationId: 'inv-003',
                guestId: 'guest-003',
                guestName: 'Carlos Rodríguez',
                guestCount: 1,
                eventId: eventId,
                scannedAt: '2025-12-03T18:40:00Z',
                scanResult: 'VALID',
                scannedByStaffId: 'staff-001',
                scannedByStaffName: 'Pedro Sánchez'
            },
            {
                id: 'scan-005',
                qrTokenId: 'token-expired',
                invitationId: 'inv-004',
                guestId: 'guest-004',
                guestName: 'Ana López',
                guestCount: 2,
                eventId: eventId,
                scannedAt: '2025-12-03T18:45:00Z',
                scanResult: 'EXPIRED',
                scannedByStaffId: 'staff-002',
                scannedByStaffName: 'Ana Martínez'
            }
        ];

        return of(scans);
    }

    private getMockAttendanceStats(eventId: string): Observable<AttendanceStats> {
        const stats: AttendanceStats = {
            totalInvitations: 50,
            totalGuests: 120,
            scannedInvitations: 4,
            scannedGuests: 8,
            attendanceRate: 6.67,
            validScans: 3,
            duplicateScans: 1,
            invalidScans: 1
        };

        return of(stats);
    }

    private getMockCSV(eventId: string): Observable<Blob> {
        const csvContent = `ID,Invitado,Personas,Fecha/Hora,Resultado,Staff
scan-001,María García,2,2025-12-03 18:30,VALID,Pedro Sánchez
scan-002,Juan Pérez,3,2025-12-03 18:32,VALID,Pedro Sánchez
scan-003,María García,2,2025-12-03 18:35,DUPLICATE,Ana Martínez
scan-004,Carlos Rodríguez,1,2025-12-03 18:40,VALID,Pedro Sánchez
scan-005,Ana López,2,2025-12-03 18:45,EXPIRED,Ana Martínez`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        return of(blob);
    }
}
