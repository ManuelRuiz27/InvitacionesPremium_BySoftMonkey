// Scan Model
export interface Scan {
    id: string;
    qrTokenId: string;
    invitationId: string;
    guestId: string;
    eventId: string;
    scannedByStaffId: string;
    scannedAt: Date;
    scanResult: ScanResult;
}

export enum ScanResult {
    VALID = 'VALID',
    DUPLICATE = 'DUPLICATE',
    EXPIRED = 'EXPIRED',
    INVALID = 'INVALID'
}

// Scan Response (from API)
export interface ScanResponse {
    result: ScanResult;
    guestName: string;
    guestCount: number;
    message?: string;
}
