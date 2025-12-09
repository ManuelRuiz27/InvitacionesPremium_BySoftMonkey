import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, tap, delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';


// Interfaces
export interface ScanValidationRequest {
    qrToken: string;
    eventId: string;
    scannedBy: string;
    scannedAt: Date;
}

export interface ScanValidationResponse {
    valid: boolean;
    status: 'VALID' | 'DUPLICATE' | 'INVALID' | 'EXPIRED';
    guest?: {
        id: string;
        fullName: string;
        guestCount: number;
        inviteType: string;
    };
    scan?: {
        id: string;
        scannedAt: Date;
        scannedBy: string;
    };
    message: string;
}

export interface ScanHistoryItem {
    id: string;
    qrToken: string;
    eventId: string;
    guestId?: string;
    guestName?: string;
    guestCount?: number;
    status: 'VALID' | 'DUPLICATE' | 'INVALID' | 'EXPIRED';
    scannedAt: Date;
    scannedBy: string;
    synced: boolean;
}

export interface SyncResponse {
    synced: number;
    failed: number;
    results: SyncResult[];
}

export interface SyncResult {
    localId: string;
    serverId?: string;
    success: boolean;
    status?: 'VALID' | 'DUPLICATE' | 'INVALID' | 'EXPIRED';
    error?: string;
}


@Injectable({
    providedIn: 'root'
})
export class ScannerService {
    private apiUrl = `${environment.apiUrl}/scanner`;
    private offlineQueue: ScanHistoryItem[] = [];
    private isOnline = navigator.onLine;

    constructor(private http: HttpClient) {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Load offline queue from localStorage
        this.loadOfflineQueue();
    }

    /**
     * Validate QR token with backend
     */
    validateQRToken(request: ScanValidationRequest): Observable<ScanValidationResponse> {
        // If offline, queue the scan
        if (!this.isOnline) {
            return this.handleOfflineValidation(request);
        }

        // Online validation
        return this.http.post<ScanValidationResponse>(`${this.apiUrl}/validate`, request).pipe(
            retry(2), // Retry up to 2 times on failure
            tap(response => {
                console.log('[Scanner Service] Validation response:', response);
                this.saveScanToHistory(request, response);
            }),
            catchError(error => this.handleValidationError(error, request))
        );
    }

    /**
     * Get scan history for an event
     */
    getScanHistory(eventId: string): Observable<ScanHistoryItem[]> {
        return this.http.get<ScanHistoryItem[]>(`${this.apiUrl}/history/${eventId}`).pipe(
            catchError(error => {
                console.error('[Scanner Service] Error fetching history:', error);
                // Fallback to local history
                return of(this.getLocalHistory(eventId));
            })
        );
    }

    /**
     * Sync offline scans when connection is restored
     */
    syncOfflineScans(): Observable<SyncResponse> {
        if (this.offlineQueue.length === 0) {
            return of({ synced: 0, failed: 0, results: [] });
        }

        console.log('[Scanner Service] Syncing', this.offlineQueue.length, 'offline scans');

        return this.http.post<SyncResponse>(`${this.apiUrl}/sync`, {
            scans: this.offlineQueue
        }).pipe(
            tap(() => {
                // Clear queue on successful sync
                this.offlineQueue = [];
                this.saveOfflineQueue();
            }),
            catchError(error => {
                console.error('[Scanner Service] Sync failed:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Mock validation for development/testing
     */
    mockValidateQRToken(qrToken: string): Observable<ScanValidationResponse> {
        console.log('[Scanner Service] Mock validation for:', qrToken);

        // Simulate API delay
        return of(this.generateMockResponse(qrToken)).pipe(
            delay(500)
        );
    }

    // Private methods

    private handleOfflineValidation(request: ScanValidationRequest): Observable<ScanValidationResponse> {
        console.log('[Scanner Service] Offline - queueing scan');

        const mockResponse = this.generateMockResponse(request.qrToken);

        // Add to offline queue
        const queueItem: ScanHistoryItem = {
            id: this.generateId(),
            qrToken: request.qrToken,
            eventId: request.eventId,
            guestId: mockResponse.guest?.id,
            guestName: mockResponse.guest?.fullName,
            guestCount: mockResponse.guest?.guestCount,
            status: mockResponse.status,
            scannedAt: request.scannedAt,
            scannedBy: request.scannedBy,
            synced: false
        };

        this.offlineQueue.push(queueItem);
        this.saveOfflineQueue();

        return of(mockResponse);
    }

    private handleValidationError(error: HttpErrorResponse, request: ScanValidationRequest): Observable<ScanValidationResponse> {
        console.error('[Scanner Service] Validation error:', error);

        // If network error, treat as offline
        if (error.status === 0) {
            return this.handleOfflineValidation(request);
        }

        // Return error response
        const errorResponse: ScanValidationResponse = {
            valid: false,
            status: 'INVALID',
            message: error.error?.message || 'Error al validar QR'
        };

        return of(errorResponse);
    }

    private saveScanToHistory(request: ScanValidationRequest, response: ScanValidationResponse): void {
        const historyItem: ScanHistoryItem = {
            id: response.scan?.id || this.generateId(),
            qrToken: request.qrToken,
            eventId: request.eventId,
            guestId: response.guest?.id,
            guestName: response.guest?.fullName,
            guestCount: response.guest?.guestCount,
            status: response.status,
            scannedAt: request.scannedAt,
            scannedBy: request.scannedBy,
            synced: true
        };

        // Save to localStorage
        const history = this.getLocalHistory(request.eventId);
        history.unshift(historyItem);

        // Keep only last 100 scans
        const trimmed = history.slice(0, 100);
        localStorage.setItem(`scanHistory_${request.eventId}`, JSON.stringify(trimmed));
    }

    private getLocalHistory(eventId: string): ScanHistoryItem[] {
        const stored = localStorage.getItem(`scanHistory_${eventId}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('[Scanner Service] Error parsing history:', e);
                return [];
            }
        }
        return [];
    }

    private loadOfflineQueue(): void {
        const stored = localStorage.getItem('offlineQueue');
        if (stored) {
            try {
                this.offlineQueue = JSON.parse(stored);
                console.log('[Scanner Service] Loaded', this.offlineQueue.length, 'offline scans');
            } catch (e) {
                console.error('[Scanner Service] Error loading offline queue:', e);
                this.offlineQueue = [];
            }
        }
    }

    private saveOfflineQueue(): void {
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    }

    private handleOnline(): void {
        console.log('[Scanner Service] Connection restored');
        this.isOnline = true;

        // Sync offline scans
        if (this.offlineQueue.length > 0) {
            this.syncOfflineScans().subscribe({
                next: () => console.log('[Scanner Service] Offline scans synced'),
                error: (err) => console.error('[Scanner Service] Sync failed:', err)
            });
        }
    }

    private handleOffline(): void {
        console.log('[Scanner Service] Connection lost');
        this.isOnline = false;
    }

    private generateMockResponse(qrToken: string): ScanValidationResponse {
        // Parse QR token to determine response
        // In production, this would be done by backend
        const random = Math.random();

        if (random > 0.7) {
            return {
                valid: true,
                status: 'VALID',
                guest: {
                    id: 'guest-' + Date.now(),
                    fullName: 'Juan Pérez',
                    guestCount: 2,
                    inviteType: 'STANDARD'
                },
                scan: {
                    id: 'scan-' + Date.now(),
                    scannedAt: new Date(),
                    scannedBy: 'staff-1'
                },
                message: 'Acceso permitido'
            };
        } else if (random > 0.5) {
            return {
                valid: false,
                status: 'DUPLICATE',
                guest: {
                    id: 'guest-' + Date.now(),
                    fullName: 'María López',
                    guestCount: 1,
                    inviteType: 'STANDARD'
                },
                message: 'Ya escaneado anteriormente'
            };
        } else if (random > 0.3) {
            return {
                valid: false,
                status: 'EXPIRED',
                message: 'QR expirado'
            };
        } else {
            return {
                valid: false,
                status: 'INVALID',
                message: 'QR inválido'
            };
        }
    }

    private generateId(): string {
        return 'scan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Getters
    get isOffline(): boolean {
        return !this.isOnline;
    }

    get pendingSyncs(): number {
        return this.offlineQueue.length;
    }
}
