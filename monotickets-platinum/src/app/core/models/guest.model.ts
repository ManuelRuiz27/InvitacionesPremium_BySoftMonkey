// Guest Model
export interface Guest {
    id: string;
    eventId: string;
    fullName: string;
    phone: string;
    email?: string;
    rsvpStatus: RsvpStatus;
    rsvpSource: RsvpSource;
    rsvpAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum RsvpStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    DECLINED = 'DECLINED'
}

export enum RsvpSource {
    CSV = 'CSV',
    RSVP_FORM = 'RSVP_FORM',
    HOST_LINK = 'HOST_LINK',
    MANUAL = 'MANUAL'
}
