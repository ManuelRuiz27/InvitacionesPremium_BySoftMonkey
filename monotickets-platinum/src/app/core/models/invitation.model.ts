// Invitation Model
export interface Invitation {
    id: string;
    eventId: string;
    guestId: string;
    inviteCode: string;
    guestCount: number; // 1-10
    inviteType: InviteType;
    landingUrl: string;
    pdfUrl?: string;
    qrTokenId?: string;
    qrToken?: string; // For mock data
    status: InvitationStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export enum InviteType {
    STANDARD = 'STANDARD',
    FAMILY = 'FAMILY',
    VIP = 'VIP'
}

export enum InvitationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    PENDING_DELIVERY = 'PENDING_DELIVERY',
    DELIVERED = 'DELIVERED',
    BOUNCED = 'BOUNCED',
    FAILED = 'FAILED'
}

// QR Token Model
export interface QRToken {
    id: string;
    invitationId: string;
    tokenJwt: string;
    expiresAt: Date;
    isActive: boolean;
    lastUsedAt?: Date;
    createdAt: Date;
}

// QR Payload (JWT content)
export interface QRPayload {
    eventId: string;
    guestId: string;
    invitationId: string;
    guestCount: number;
    exp: number;
    jti: string;
}

// Delivery Attempt Model
export interface DeliveryAttempt {
    id: string;
    invitationId: string;
    guestId: string;
    channel: DeliveryChannel;
    status: DeliveryStatus;
    providerMessageId?: string;
    errorCode?: string;
    createdAt: Date;
}

export enum DeliveryChannel {
    SMS = 'SMS',
    WHATSAPP = 'WHATSAPP'
}

export enum DeliveryStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED'
}
