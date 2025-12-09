import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ScannerService, ScanValidationRequest, ScanValidationResponse, ScanHistoryItem } from './scanner.service';
import { environment } from '../../../../environments/environment';

describe('ScannerService - API Contract Tests', () => {
    let service: ScannerService;
    let httpMock: HttpTestingController;
    const apiUrl = `${environment.apiUrl}/scanner`;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ScannerService]
        });
        service = TestBed.inject(ScannerService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    describe('POST /scanner/validate - Contract Validation', () => {
        it('should send correct request schema', () => {
            const request: ScanValidationRequest = {
                qrToken: 'EV2025-001-GUEST-123-ABC',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date('2025-12-05T03:45:00.000Z')
            };

            service.validateQRToken(request).subscribe();

            const req = httpMock.expectOne(`${apiUrl}/validate`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(request);

            // Verify all required fields are present
            expect(req.request.body.qrToken).toBeDefined();
            expect(req.request.body.eventId).toBeDefined();
            expect(req.request.body.scannedBy).toBeDefined();
            expect(req.request.body.scannedAt).toBeDefined();
        });

        it('should handle VALID response correctly', () => {
            const request: ScanValidationRequest = {
                qrToken: 'EV2025-001-GUEST-123-ABC',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            const mockResponse: ScanValidationResponse = {
                valid: true,
                status: 'VALID',
                guest: {
                    id: 'guest-123',
                    fullName: 'Juan Pérez',
                    guestCount: 2,
                    inviteType: 'STANDARD'
                },
                scan: {
                    id: 'scan-789',
                    scannedAt: new Date(),
                    scannedBy: 'staff-user-456'
                },
                message: 'Acceso permitido'
            };

            service.validateQRToken(request).subscribe(response => {
                // Verify response schema
                expect(response.valid).toBe(true);
                expect(response.status).toBe('VALID');
                expect(response.guest).toBeDefined();
                expect(response.guest?.id).toBeDefined();
                expect(response.guest?.fullName).toBeDefined();
                expect(response.guest?.guestCount).toBeDefined();
                expect(response.guest?.inviteType).toBeDefined();
                expect(response.scan).toBeDefined();
                expect(response.scan?.id).toBeDefined();
                expect(response.message).toBeDefined();
            });

            const req = httpMock.expectOne(`${apiUrl}/validate`);
            req.flush(mockResponse);
        });

        it('should handle DUPLICATE response correctly', () => {
            const request: ScanValidationRequest = {
                qrToken: 'EV2025-001-GUEST-123-ABC',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            const mockResponse: ScanValidationResponse = {
                valid: false,
                status: 'DUPLICATE',
                guest: {
                    id: 'guest-123',
                    fullName: 'Juan Pérez',
                    guestCount: 2,
                    inviteType: 'STANDARD'
                },
                message: 'Ya escaneado anteriormente a las 20:30'
            };

            service.validateQRToken(request).subscribe(response => {
                expect(response.valid).toBe(false);
                expect(response.status).toBe('DUPLICATE');
                expect(response.guest).toBeDefined();
                expect(response.message).toContain('escaneado');
            });

            const req = httpMock.expectOne(`${apiUrl}/validate`);
            req.flush(mockResponse);
        });

        it('should handle INVALID response correctly', () => {
            const request: ScanValidationRequest = {
                qrToken: 'INVALID-QR',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            const mockResponse: ScanValidationResponse = {
                valid: false,
                status: 'INVALID',
                message: 'QR inválido o no encontrado'
            };

            service.validateQRToken(request).subscribe(response => {
                expect(response.valid).toBe(false);
                expect(response.status).toBe('INVALID');
                expect(response.guest).toBeUndefined();
                expect(response.message).toBeDefined();
            });

            const req = httpMock.expectOne(`${apiUrl}/validate`);
            req.flush(mockResponse);
        });

        it('should handle EXPIRED response correctly', () => {
            const request: ScanValidationRequest = {
                qrToken: 'EV2024-001-GUEST-OLD-XYZ',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            const mockResponse: ScanValidationResponse = {
                valid: false,
                status: 'EXPIRED',
                message: 'QR expirado'
            };

            service.validateQRToken(request).subscribe(response => {
                expect(response.valid).toBe(false);
                expect(response.status).toBe('EXPIRED');
                expect(response.message).toContain('expirado');
            });

            const req = httpMock.expectOne(`${apiUrl}/validate`);
            req.flush(mockResponse);
        });

        it('should retry on failure', () => {
            const request: ScanValidationRequest = {
                qrToken: 'EV2025-001-GUEST-123-ABC',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            service.validateQRToken(request).subscribe();

            // First attempt fails
            const req1 = httpMock.expectOne(`${apiUrl}/validate`);
            req1.flush('Error', { status: 500, statusText: 'Internal Server Error' });

            // Second attempt fails
            const req2 = httpMock.expectOne(`${apiUrl}/validate`);
            req2.flush('Error', { status: 500, statusText: 'Internal Server Error' });

            // Third attempt succeeds
            const req3 = httpMock.expectOne(`${apiUrl}/validate`);
            req3.flush({
                valid: true,
                status: 'VALID',
                message: 'Acceso permitido'
            });
        });

        it('should handle network error (offline)', () => {
            const request: ScanValidationRequest = {
                qrToken: 'EV2025-001-GUEST-123-ABC',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            service.validateQRToken(request).subscribe(response => {
                // Should fallback to offline validation
                expect(response).toBeDefined();
                expect(response.status).toBeDefined();
            });

            const req = httpMock.expectOne(`${apiUrl}/validate`);
            req.error(new ProgressEvent('error'), { status: 0 });
        });
    });

    describe('GET /scanner/history/:eventId - Contract Validation', () => {
        it('should fetch scan history with correct URL', () => {
            const eventId = '1';

            service.getScanHistory(eventId).subscribe();

            const req = httpMock.expectOne(`${apiUrl}/history/${eventId}`);
            expect(req.request.method).toBe('GET');
        });

        it('should handle history response correctly', () => {
            const eventId = '1';
            const mockHistory: ScanHistoryItem[] = [
                {
                    id: 'scan-789',
                    qrToken: 'EV2025-001-GUEST-123-ABC',
                    eventId: '1',
                    guestId: 'guest-123',
                    guestName: 'Juan Pérez',
                    guestCount: 2,
                    status: 'VALID',
                    scannedAt: new Date('2025-12-05T03:45:00.000Z'),
                    scannedBy: 'staff-user-456',
                    synced: true
                }
            ];

            service.getScanHistory(eventId).subscribe(history => {
                expect(history).toEqual(mockHistory);
                expect(history[0].id).toBeDefined();
                expect(history[0].qrToken).toBeDefined();
                expect(history[0].eventId).toBeDefined();
                expect(history[0].status).toBeDefined();
                expect(history[0].scannedAt).toBeDefined();
                expect(history[0].scannedBy).toBeDefined();
                expect(history[0].synced).toBeDefined();
            });

            const req = httpMock.expectOne(`${apiUrl}/history/${eventId}`);
            req.flush(mockHistory);
        });

        it('should fallback to local history on error', () => {
            const eventId = '1';
            const localHistory: ScanHistoryItem[] = [
                {
                    id: 'local-scan-1',
                    qrToken: 'LOCAL-QR',
                    eventId: '1',
                    status: 'VALID',
                    scannedAt: new Date(),
                    scannedBy: 'staff-1',
                    synced: false
                }
            ];

            // Save to localStorage
            localStorage.setItem(`scanHistory_${eventId}`, JSON.stringify(localHistory));

            service.getScanHistory(eventId).subscribe(history => {
                expect(history).toEqual(localHistory);
            });

            const req = httpMock.expectOne(`${apiUrl}/history/${eventId}`);
            req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
        });
    });

    describe('POST /scanner/sync - Contract Validation', () => {
        it('should send correct sync request schema', () => {
            const offlineScans: ScanHistoryItem[] = [
                {
                    id: 'local-scan-1',
                    qrToken: 'EV2025-001-GUEST-123-ABC',
                    eventId: '1',
                    guestId: 'guest-123',
                    guestName: 'Juan Pérez',
                    guestCount: 2,
                    status: 'VALID',
                    scannedAt: new Date('2025-12-05T03:40:00.000Z'),
                    scannedBy: 'staff-user-456',
                    synced: false
                }
            ];

            // Add to offline queue
            localStorage.setItem('offlineQueue', JSON.stringify(offlineScans));

            // Reload service to pick up offline queue
            service = new ScannerService(TestBed.inject(HttpClientTestingModule) as any);

            service.syncOfflineScans().subscribe();

            const req = httpMock.expectOne(`${apiUrl}/sync`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body.scans).toBeDefined();
            expect(req.request.body.scans.length).toBe(1);
        });

        it('should handle successful sync response', () => {
            const offlineScans: ScanHistoryItem[] = [
                {
                    id: 'local-scan-1',
                    qrToken: 'QR-1',
                    eventId: '1',
                    status: 'VALID',
                    scannedAt: new Date(),
                    scannedBy: 'staff-1',
                    synced: false
                }
            ];

            localStorage.setItem('offlineQueue', JSON.stringify(offlineScans));
            service = new ScannerService(TestBed.inject(HttpClientTestingModule) as any);

            const mockSyncResponse = {
                synced: 1,
                failed: 0,
                results: [
                    {
                        localId: 'local-scan-1',
                        serverId: 'scan-790',
                        success: true,
                        status: 'VALID'
                    }
                ]
            };

            service.syncOfflineScans().subscribe(response => {
                expect(response.synced).toBe(1);
                expect(response.failed).toBe(0);
                expect(response.results).toBeDefined();
            });

            const req = httpMock.expectOne(`${apiUrl}/sync`);
            req.flush(mockSyncResponse);
        });

        it('should return early if no offline scans', () => {
            service.syncOfflineScans().subscribe(response => {
                expect(response.synced).toBe(0);
            });

            httpMock.expectNone(`${apiUrl}/sync`);
        });
    });

    describe('Offline Mode', () => {
        it('should queue scans when offline', () => {
            // Simulate offline
            Object.defineProperty(service, 'isOnline', { value: false, writable: true });

            const request: ScanValidationRequest = {
                qrToken: 'EV2025-001-GUEST-123-ABC',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            service.validateQRToken(request).subscribe(response => {
                expect(response).toBeDefined();
                expect(service.pendingSyncs).toBeGreaterThan(0);
            });

            httpMock.expectNone(`${apiUrl}/validate`);
        });

        it('should save scan to history', () => {
            const request: ScanValidationRequest = {
                qrToken: 'EV2025-001-GUEST-123-ABC',
                eventId: '1',
                scannedBy: 'staff-user-456',
                scannedAt: new Date()
            };

            const mockResponse: ScanValidationResponse = {
                valid: true,
                status: 'VALID',
                guest: {
                    id: 'guest-123',
                    fullName: 'Juan Pérez',
                    guestCount: 2,
                    inviteType: 'STANDARD'
                },
                scan: {
                    id: 'scan-789',
                    scannedAt: new Date(),
                    scannedBy: 'staff-user-456'
                },
                message: 'Acceso permitido'
            };

            service.validateQRToken(request).subscribe(() => {
                const stored = localStorage.getItem(`scanHistory_${request.eventId}`);
                expect(stored).toBeDefined();

                const history = JSON.parse(stored!);
                expect(history.length).toBeGreaterThan(0);
                expect(history[0].qrToken).toBe(request.qrToken);
            });

            const req = httpMock.expectOne(`${apiUrl}/validate`);
            req.flush(mockResponse);
        });
    });
});
