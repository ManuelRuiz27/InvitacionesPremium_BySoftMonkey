// Event Model
export interface Event {
    id: string;
    plannerId: string;
    name: string;
    type: EventType;
    date: Date;
    time: string;
    locationText: string;
    locationLat?: number;
    locationLng?: number;
    templateType: TemplateType;
    templateVariant?: string;
    isPremium: boolean;
    guestCountDefault?: number;
    allowPartialEntry?: boolean;
    rsvpFormUrl?: string;
    hostFormUrl?: string;
    status: EventStatus;
    createdAt: Date;
    updatedAt: Date;
}

export enum EventType {
    BODA = 'BODA',
    XV = 'XV',
    GRADUACION = 'GRADUACION',
    BAUTIZO = 'BAUTIZO',
    BABY_SHOWER = 'BABY_SHOWER',
    ANIVERSARIO = 'ANIVERSARIO',
    COMUNION = 'COMUNION',
    SOCIAL = 'SOCIAL'
}

export enum TemplateType {
    PDF = 'PDF',
    PREMIUM = 'PREMIUM'
}

export enum EventStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    CLOSED = 'CLOSED',
    BLOCKED = 'BLOCKED'
}

// Template Model
export interface Template {
    id: string;
    name: string;
    category: EventType;
    type: TemplateType;
    isPremium: boolean;
    configJson: any;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
