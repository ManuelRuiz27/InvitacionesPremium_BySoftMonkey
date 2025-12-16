import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

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

    constructor(private http: HttpClient) { }

    getScans(eventId: string): Observable<Scan[]> {
        return this.http.get<Scan[]>(`${this.apiUrl}/event/${eventId}`);
    }

    getScansRealtime(eventId: string): Observable<Scan[]> {
        return interval(10000).pipe(
            startWith(0),
            switchMap(() => this.getScans(eventId))
        );
    }

    getAttendanceStats(eventId: string): Observable<AttendanceStats> {
        return this.http.get<AttendanceStats>(`${this.apiUrl}/stats/${eventId}`);
    }

    exportScansCSV(eventId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${eventId}`, { responseType: 'blob' });
    }

    saveCSVFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
