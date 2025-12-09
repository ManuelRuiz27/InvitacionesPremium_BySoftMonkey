import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { ScannerService, ScanValidationRequest, ScanValidationResponse } from '../services/scanner.service';
import { AuthService } from '../../../core/services/auth.service';


interface ScanResult {
    valid: boolean;
    status: 'VALID' | 'DUPLICATE' | 'INVALID' | 'EXPIRED';
    guestName?: string;
    guestCount?: number;
    message: string;
    scannedAt: Date;
}

@Component({
    selector: 'app-scanner',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatProgressSpinnerModule,
        ZXingScannerModule
    ],
    templateUrl: './scanner.component.html',
    styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements OnInit, OnDestroy {
    // Camera
    availableDevices: MediaDeviceInfo[] = [];
    currentDevice: MediaDeviceInfo | undefined;
    hasDevices = false;
    hasPermission = false;

    // Scanner
    allowedFormats = [BarcodeFormat.QR_CODE];
    isScanning = true;

    // Feedback
    lastScanResult: ScanResult | null = null;
    showFeedback = false;
    feedbackTimeout: any;

    // History
    scanHistory: ScanResult[] = [];

    // Offline status
    isOffline = false;
    pendingSyncs = 0;

    constructor(
        private router: Router,
        private scannerService: ScannerService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadScanHistory();
        this.updateOfflineStatus();

        // Update offline status periodically
        setInterval(() => this.updateOfflineStatus(), 5000);
    }

    ngOnDestroy(): void {
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }
    }

    // Camera Events
    onCamerasFound(devices: MediaDeviceInfo[]): void {
        this.availableDevices = devices;
        this.hasDevices = Boolean(devices && devices.length);

        // Select back camera by default
        const backCamera = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear')
        );
        this.currentDevice = backCamera || devices[0];
    }

    onPermissionResponse(hasPermission: boolean): void {
        this.hasPermission = hasPermission;
        if (!hasPermission) {
            console.error('Camera permission denied');
        }
    }

    onScanSuccess(result: string): void {
        if (!this.isScanning) return;

        console.log('[Scanner] QR detected:', result);
        this.isScanning = false; // Pause scanning

        // Validate QR token
        this.validateQRToken(result);
    }

    onScanError(error: Error): void {
        console.error('[Scanner] Error:', error);
    }

    // QR Validation
    async validateQRToken(qrToken: string): Promise<void> {
        try {
            const currentUser = this.authService.currentUserValue;
            const eventId = '1'; // TODO: Get from route or context

            const request: ScanValidationRequest = {
                qrToken,
                eventId,
                scannedBy: currentUser?.id || 'staff-unknown',
                scannedAt: new Date()
            };

            // Use mock validation for now (replace with real API when ready)
            this.scannerService.mockValidateQRToken(qrToken).subscribe({
                next: (response) => this.handleValidationResponse(response),
                error: (error) => this.handleValidationError(error)
            });

        } catch (error) {
            console.error('[Scanner] Validation error:', error);
            this.isScanning = true; // Resume on error
        }
    }

    private handleValidationResponse(response: ScanValidationResponse): void {
        const scanResult: ScanResult = {
            valid: response.valid,
            status: response.status,
            guestName: response.guest?.fullName,
            guestCount: response.guest?.guestCount,
            message: response.message,
            scannedAt: new Date()
        };

        this.lastScanResult = scanResult;
        this.showFeedback = true;

        // Add to history
        this.scanHistory.unshift(scanResult);
        this.saveScanHistory();

        // Vibrate based on result
        this.vibrate(scanResult.status);

        // Hide feedback after 3 seconds and resume scanning
        this.feedbackTimeout = setTimeout(() => {
            this.showFeedback = false;
            this.isScanning = true;
        }, 3000);
    }

    private handleValidationError(error: any): void {
        console.error('[Scanner] Validation failed:', error);

        const errorResult: ScanResult = {
            valid: false,
            status: 'INVALID',
            message: 'Error al validar QR',
            scannedAt: new Date()
        };

        this.handleValidationResponse(errorResult);
    }

    // Vibration feedback
    private vibrate(status: string): void {
        if (!('vibrate' in navigator)) return;

        switch (status) {
            case 'VALID':
                navigator.vibrate(200); // Single vibration
                break;
            case 'DUPLICATE':
                navigator.vibrate([200, 100, 200]); // Double vibration
                break;
            case 'INVALID':
            case 'EXPIRED':
                navigator.vibrate([200, 100, 200, 100, 200]); // Triple vibration
                break;
        }
    }

    // Camera controls
    toggleCamera(): void {
        const currentIndex = this.availableDevices.indexOf(this.currentDevice!);
        const nextIndex = (currentIndex + 1) % this.availableDevices.length;
        this.currentDevice = this.availableDevices[nextIndex];
    }

    // History
    private loadScanHistory(): void {
        const stored = localStorage.getItem('scanHistory');
        if (stored) {
            this.scanHistory = JSON.parse(stored);
        }
    }

    private saveScanHistory(): void {
        // Keep only last 50 scans
        const history = this.scanHistory.slice(0, 50);
        localStorage.setItem('scanHistory', JSON.stringify(history));
    }

    // Offline status
    private updateOfflineStatus(): void {
        this.isOffline = this.scannerService.isOffline;
        this.pendingSyncs = this.scannerService.pendingSyncs;
    }

    viewHistory(): void {
        this.router.navigate(['/staff/scan-history']);
    }

    goBack(): void {
        this.router.navigate(['/']);
    }

    // Getters for template
    get feedbackClass(): string {
        if (!this.lastScanResult) return '';
        return `feedback-${this.lastScanResult.status.toLowerCase()}`;
    }

    get feedbackIcon(): string {
        if (!this.lastScanResult) return '';
        switch (this.lastScanResult.status) {
            case 'VALID': return 'check_circle';
            case 'DUPLICATE': return 'warning';
            case 'INVALID':
            case 'EXPIRED': return 'cancel';
            default: return 'help';
        }
    }
}
