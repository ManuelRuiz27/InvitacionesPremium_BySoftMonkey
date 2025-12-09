import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
    User,
    UserRole,
    Event,
    EventType,
    EventStatus,
    TemplateType,
    Guest,
    RsvpStatus,
    RsvpSource,
    Invitation,
    InviteType,
    InvitationStatus
} from '../models';

// Mock data for testing
@Injectable({
    providedIn: 'root'
})
export class MockDataService {

    // Mock Users
    private mockUsers: User[] = [
        {
            id: '1',
            fullName: 'Admin Director',
            email: 'director@monotickets.com',
            phone: '+52 55 1234 5678',
            role: UserRole.DIRECTOR_GLOBAL,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
        },
        {
            id: '2',
            fullName: 'María García',
            email: 'maria@eventoselegantes.com',
            phone: '+52 55 2345 6789',
            role: UserRole.PLANNER,
            createdAt: new Date('2024-02-10'),
            updatedAt: new Date('2024-02-10')
        },
        {
            id: '3',
            fullName: 'Carlos Rodríguez',
            email: 'carlos@bodasperfectas.com',
            phone: '+52 55 3456 7890',
            role: UserRole.PLANNER,
            createdAt: new Date('2024-03-05'),
            updatedAt: new Date('2024-03-05')
        },
        {
            id: '4',
            fullName: 'Ana Martínez',
            email: 'ana@xvdreams.com',
            phone: '+52 55 4567 8901',
            role: UserRole.PLANNER,
            createdAt: new Date('2024-04-20'),
            updatedAt: new Date('2024-04-20')
        }
    ];

    // Mock Events
    private mockEvents: Event[] = [
        {
            id: '1',
            plannerId: '2',
            name: 'Boda de Juan y Laura',
            type: EventType.BODA,
            date: new Date('2025-06-15'),
            time: '18:00',
            locationText: 'Hacienda Los Laureles, Cuernavaca',
            locationLat: 18.9186,
            locationLng: -99.2342,
            templateType: TemplateType.PREMIUM,
            templateVariant: 'elegant-rose',
            isPremium: true,
            status: EventStatus.PUBLISHED,
            createdAt: new Date('2024-11-01'),
            updatedAt: new Date('2024-11-15')
        },
        {
            id: '2',
            plannerId: '3',
            name: 'XV Años de Sofía',
            type: EventType.XV,
            date: new Date('2025-05-20'),
            time: '19:00',
            locationText: 'Salón Crystal, CDMX',
            locationLat: 19.4326,
            locationLng: -99.1332,
            templateType: TemplateType.PREMIUM,
            templateVariant: 'princess-pink',
            isPremium: true,
            status: EventStatus.PUBLISHED,
            createdAt: new Date('2024-10-15'),
            updatedAt: new Date('2024-11-01')
        },
        {
            id: '3',
            plannerId: '2',
            name: 'Graduación Generación 2025',
            type: EventType.GRADUACION,
            date: new Date('2025-07-10'),
            time: '10:00',
            locationText: 'Auditorio Nacional, CDMX',
            locationLat: 19.4260,
            locationLng: -99.1919,
            templateType: TemplateType.PDF,
            isPremium: false,
            status: EventStatus.PUBLISHED,
            createdAt: new Date('2024-11-20'),
            updatedAt: new Date('2024-11-25')
        },
        {
            id: '4',
            plannerId: '4',
            name: 'Bautizo de Mateo',
            type: EventType.BAUTIZO,
            date: new Date('2025-04-12'),
            time: '12:00',
            locationText: 'Parroquia San José, Puebla',
            locationLat: 19.0414,
            locationLng: -98.2063,
            templateType: TemplateType.PDF,
            isPremium: false,
            status: EventStatus.DRAFT,
            createdAt: new Date('2024-11-28'),
            updatedAt: new Date('2024-11-28')
        },
        {
            id: '5',
            plannerId: '3',
            name: 'Aniversario 50 Años',
            type: EventType.ANIVERSARIO,
            date: new Date('2025-08-25'),
            time: '20:00',
            locationText: 'Jardín Botánico, Guadalajara',
            locationLat: 20.6597,
            locationLng: -103.3496,
            templateType: TemplateType.PREMIUM,
            templateVariant: 'golden-anniversary',
            isPremium: true,
            status: EventStatus.PUBLISHED,
            createdAt: new Date('2024-11-10'),
            updatedAt: new Date('2024-11-22')
        }
    ];

    constructor() {
        // Cargar datos desde localStorage si existen
        this.loadFromLocalStorage();
    }

    // ========== LOCALSTORAGE METHODS ==========

    private loadFromLocalStorage(): void {
        const storedGuests = localStorage.getItem('mockGuests');
        const storedInvitations = localStorage.getItem('mockInvitations');

        if (storedGuests) {
            try {
                this.mockGuests = JSON.parse(storedGuests);
                console.log('[MockData] Loaded', this.mockGuests.length, 'guests from localStorage');
            } catch (e) {
                console.error('Error loading guests from localStorage:', e);
            }
        } else {
            // Si no hay datos, guardar los datos iniciales en localStorage
            console.log('[MockData] Initializing localStorage with default guests');
            this.saveGuestsToLocalStorage();
        }

        if (storedInvitations) {
            try {
                this.mockInvitations = JSON.parse(storedInvitations);
                console.log('[MockData] Loaded', this.mockInvitations.length, 'invitations from localStorage');
            } catch (e) {
                console.error('Error loading invitations from localStorage:', e);
            }
        } else {
            // Si no hay datos, guardar los datos iniciales en localStorage
            console.log('[MockData] Initializing localStorage with default invitations');
            this.saveInvitationsToLocalStorage();
        }
    }

    private saveGuestsToLocalStorage(): void {
        try {
            localStorage.setItem('mockGuests', JSON.stringify(this.mockGuests));
        } catch (e) {
            console.error('Error saving guests to localStorage:', e);
        }
    }

    private saveInvitationsToLocalStorage(): void {
        try {
            localStorage.setItem('mockInvitations', JSON.stringify(this.mockInvitations));
        } catch (e) {
            console.error('Error saving invitations to localStorage:', e);
        }
    }

    // ========== PUBLIC METHODS FOR EXTERNAL UPDATES ==========

    /**
     * Actualizar estado de invitación (usado por DeliveryService)
     */
    updateInvitationStatus(invitationId: string, status: InvitationStatus, sentAt?: Date, deliveredAt?: Date): void {
        const index = this.mockInvitations.findIndex(inv => inv.id === invitationId);
        if (index !== -1) {
            this.mockInvitations[index].status = status;
            this.mockInvitations[index].updatedAt = new Date();
            if (sentAt) this.mockInvitations[index].sentAt = sentAt;
            if (deliveredAt) this.mockInvitations[index].deliveredAt = deliveredAt;
            this.saveInvitationsToLocalStorage();
        }
    }

    /**
     * Obtener invitación por ID (usado por DeliveryService)
     */
    getInvitationById(invitationId: string): Invitation | undefined {
        return this.mockInvitations.find(inv => inv.id === invitationId);
    }

    /**
     * Actualizar estado RSVP de invitado (usado por GuestService/RSVP Form)
     */
    updateGuestRSVPStatus(guestId: string, rsvpStatus: RsvpStatus, rsvpSource: RsvpSource): void {
        console.log('[MockData] Actualizando RSVP Status para guest:', guestId, 'Status:', rsvpStatus);
        const index = this.mockGuests.findIndex(g => g.id === guestId);
        console.log('[MockData] Guest index encontrado:', index);
        if (index !== -1) {
            this.mockGuests[index].rsvpStatus = rsvpStatus;
            this.mockGuests[index].rsvpSource = rsvpSource;
            this.mockGuests[index].rsvpAt = new Date();
            this.mockGuests[index].updatedAt = new Date();
            this.saveGuestsToLocalStorage();
            console.log('[MockData] Guest actualizado:', this.mockGuests[index]);
            console.log('[MockData] localStorage guardado');
        } else {
            console.error('[MockData] Guest NO encontrado con ID:', guestId);
        }
    }

    /**
     * Obtener invitado por código de invitación (usado por RSVP Form)
     */
    getGuestByInviteCode(inviteCode: string): Guest | undefined {
        // IMPORTANTE: Recargar desde localStorage para asegurar datos actualizados
        this.loadFromLocalStorage();

        console.log('[MockData] Buscando invitation con inviteCode:', inviteCode);
        console.log('[MockData] Total invitations en memoria:', this.mockInvitations.length);

        const invitation = this.mockInvitations.find(inv => inv.inviteCode === inviteCode);
        console.log('[MockData] Invitation encontrada:', invitation);

        if (invitation) {
            const guest = this.mockGuests.find(g => g.id === invitation.guestId);
            console.log('[MockData] Guest encontrado:', guest);
            return guest;
        }

        console.warn('[MockData] No se encontró invitation con inviteCode:', inviteCode);
        return undefined;
    }

    // ========== EXISTING METHODS ==========

    // Login mock
    login(email: string, password: string): Observable<{ token: string; user: User }> {
        const user = this.mockUsers.find(u => u.email === email);

        if (user && password === 'password123') {
            return of({
                token: 'mock-jwt-token-' + user.id,
                user: user
            }).pipe(delay(500));
        }

        throw new Error('Invalid credentials');
    }

    // Get all users (planners)
    getUsers(): Observable<User[]> {
        return of(this.mockUsers.filter(u => u.role === UserRole.PLANNER)).pipe(delay(300));
    }

    // Get all events
    getEvents(): Observable<Event[]> {
        return of(this.mockEvents).pipe(delay(300));
    }

    // Get event by ID
    getEventById(id: string): Observable<Event | undefined> {
        return of(this.mockEvents.find(e => e.id === id)).pipe(delay(300));
    }

    // Get events by planner
    getEventsByPlanner(plannerId: string): Observable<Event[]> {
        return of(this.mockEvents.filter(e => e.plannerId === plannerId)).pipe(delay(300));
    }

    // Get guests by event
    getGuestsByEvent(eventId: string): Observable<Guest[]> {
        return of(this.mockGuests.filter(g => g.eventId === eventId)).pipe(delay(300));
    }

    // Get invitations by event
    getInvitationsByEvent(eventId: string): Observable<Invitation[]> {
        return of(this.mockInvitations.filter(i => i.eventId === eventId)).pipe(delay(300));
    }

    // Global metrics
    getGlobalMetrics(): Observable<any> {
        return of({
            totalEvents: this.mockEvents.length,
            totalInvitations: this.mockInvitations.length,
            totalConfirmations: this.mockGuests.filter(g => g.rsvpStatus === RsvpStatus.CONFIRMED).length,
            totalScans: Math.floor(this.mockGuests.filter(g => g.rsvpStatus === RsvpStatus.CONFIRMED).length * 0.8)
        }).pipe(delay(300));
    }

    // Planner metrics
    getPlannerMetrics(plannerId: string): Observable<any> {
        const plannerEvents = this.mockEvents.filter(e => e.plannerId === plannerId);
        const planner = this.mockUsers.find(u => u.id === plannerId);

        return of({
            plannerId: plannerId,
            plannerName: planner?.fullName || 'Unknown',
            orgName: 'Organización ' + planner?.fullName,
            totalEvents: plannerEvents.length,
            totalInvitations: Math.floor(plannerEvents.length * 50),
            totalConfirmations: Math.floor(plannerEvents.length * 35),
            totalScans: Math.floor(plannerEvents.length * 28)
        }).pipe(delay(300));
    }

    // Get planners list
    getPlannersList(page: number = 1, limit: number = 10): Observable<any> {
        const planners = this.mockUsers.filter(u => u.role === UserRole.PLANNER);
        const start = (page - 1) * limit;
        const end = start + limit;

        return of({
            planners: planners.slice(start, end).map(p => ({
                id: p.id,
                name: p.fullName,
                email: p.email,
                orgName: 'Organización ' + p.fullName,
                totalEvents: this.mockEvents.filter(e => e.plannerId === p.id).length,
                createdAt: p.createdAt
            })),
            total: planners.length
        }).pipe(delay(300));
    }

    // Planner Dashboard Metrics
    getPlannerDashboardMetrics(): Observable<any> {
        // Simular que el usuario logueado es el planner con ID '2' (María García)
        const currentPlannerId = '2';
        const plannerEvents = this.mockEvents.filter(e => e.plannerId === currentPlannerId);

        // Calcular eventos por tipo
        const eventsByType = Object.values(EventType).map(type => ({
            type,
            count: plannerEvents.filter(e => e.type === type).length
        })).filter(item => item.count > 0);

        const totalInvitations = plannerEvents.length * 50;
        const totalConfirmations = plannerEvents.length * 35;

        return of({
            totalEvents: plannerEvents.length,
            totalInvitations,
            totalConfirmations,
            confirmationRate: totalInvitations > 0 ? Math.round((totalConfirmations / totalInvitations) * 100) : 0,
            eventsByType
        }).pipe(delay(300));
    }

    // Get my events (for logged planner)
    getMyEvents(page: number = 1, limit: number = 10, filters?: any): Observable<any> {
        const currentPlannerId = '2'; // Simular usuario logueado
        let events = this.mockEvents.filter(e => e.plannerId === currentPlannerId);

        // Apply filters
        if (filters) {
            if (filters.type) {
                events = events.filter(e => e.type === filters.type);
            }
            if (filters.status) {
                events = events.filter(e => e.status === filters.status);
            }
            if (filters.search) {
                events = events.filter(e =>
                    e.name.toLowerCase().includes(filters.search.toLowerCase())
                );
            }
        }

        // Sort by date desc
        events.sort((a, b) => b.date.getTime() - a.date.getTime());

        const start = (page - 1) * limit;
        const end = start + limit;

        return of({
            events: events.slice(start, end),
            total: events.length
        }).pipe(delay(300));
    }

    // Create event
    createEvent(eventData: any): Observable<Event> {
        const newEvent: Event = {
            id: (this.mockEvents.length + 1).toString(),
            plannerId: '2', // Current planner
            name: eventData.name,
            type: eventData.type,
            date: new Date(eventData.date),
            time: eventData.time,
            locationText: eventData.locationText,
            locationLat: eventData.locationLat,
            locationLng: eventData.locationLng,
            templateType: eventData.templateType === 'PREMIUM' ? TemplateType.PREMIUM : TemplateType.PDF,
            templateVariant: eventData.templateVariant,
            isPremium: eventData.templateType === 'PREMIUM',
            status: EventStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.mockEvents.push(newEvent);
        return of(newEvent).pipe(delay(500));
    }

    // Update event
    updateEvent(id: string, eventData: any): Observable<Event> {
        const index = this.mockEvents.findIndex(e => e.id === id);

        if (index === -1) {
            throw new Error('Event not found');
        }

        const updatedEvent = {
            ...this.mockEvents[index],
            ...eventData,
            date: eventData.date ? new Date(eventData.date) : this.mockEvents[index].date,
            updatedAt: new Date()
        };

        this.mockEvents[index] = updatedEvent;
        return of(updatedEvent).pipe(delay(500));
    }

    // Delete event
    deleteEvent(id: string): Observable<void> {
        const index = this.mockEvents.findIndex(e => e.id === id);

        if (index === -1) {
            throw new Error('Event not found');
        }

        this.mockEvents.splice(index, 1);
        return of(void 0).pipe(delay(300));
    }

    // Get templates
    getTemplates(): Observable<any[]> {
        return of([
            {
                id: '1',
                name: 'Premium',
                type: 'PREMIUM',
                description: 'Invitaciones interactivas con efecto flipbook y animaciones',
                previewUrl: '/assets/templates/premium-preview.jpg'
            },
            {
                id: '2',
                name: 'PDF',
                type: 'PDF',
                description: 'Invitaciones en formato PDF descargable',
                previewUrl: '/assets/templates/pdf-preview.jpg'
            }
        ]).pipe(delay(300));
    }

    // Get template variants
    getTemplateVariants(templateType: string): Observable<any[]> {
        if (templateType === 'PREMIUM') {
            return of([
                {
                    id: '1',
                    name: 'Elegant Rose',
                    templateId: '1',
                    previewUrl: '/assets/templates/elegant-rose.jpg',
                    colorScheme: 'Rosa elegante con dorado'
                },
                {
                    id: '2',
                    name: 'Princess Pink',
                    templateId: '1',
                    previewUrl: '/assets/templates/princess-pink.jpg',
                    colorScheme: 'Rosa princesa con brillos'
                },
                {
                    id: '3',
                    name: 'Golden Anniversary',
                    templateId: '1',
                    previewUrl: '/assets/templates/golden-anniversary.jpg',
                    colorScheme: 'Dorado con blanco'
                },
                {
                    id: '4',
                    name: 'Blue Elegance',
                    templateId: '1',
                    previewUrl: '/assets/templates/blue-elegance.jpg',
                    colorScheme: 'Azul marino con plateado'
                }
            ]).pipe(delay(300));
        }

        return of([]).pipe(delay(300));
    }

    // Get upcoming events
    getUpcomingEvents(limit: number = 5): Observable<Event[]> {
        const currentPlannerId = '2';
        const today = new Date();

        const upcoming = this.mockEvents
            .filter(e => e.plannerId === currentPlannerId && e.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, limit);

        return of(upcoming).pipe(delay(300));
    }

    // ===== SPRINT 4: GUESTS AND INVITATIONS =====

    // Mock Guests
    private mockGuests: Guest[] = [
        { id: 'g1', eventId: 'e1', fullName: 'Juan Pérez', phone: '+52 55 1111 1111', email: 'juan@example.com', rsvpStatus: RsvpStatus.CONFIRMED, rsvpSource: RsvpSource.CSV, rsvpAt: new Date('2024-11-20'), createdAt: new Date('2024-11-01'), updatedAt: new Date('2024-11-20') },
        { id: 'g2', eventId: 'e1', fullName: 'María López', phone: '+52 55 2222 2222', email: 'maria@example.com', rsvpStatus: RsvpStatus.PENDING, rsvpSource: RsvpSource.CSV, createdAt: new Date('2024-11-01'), updatedAt: new Date('2024-11-01') },
        { id: 'g3', eventId: 'e1', fullName: 'Carlos Gómez', phone: '+52 55 3333 3333', rsvpStatus: RsvpStatus.DECLINED, rsvpSource: RsvpSource.MANUAL, rsvpAt: new Date('2024-11-18'), createdAt: new Date('2024-11-05'), updatedAt: new Date('2024-11-18') },
        { id: 'g4', eventId: 'e2', fullName: 'Ana Martínez', phone: '+52 55 4444 4444', email: 'ana@example.com', rsvpStatus: RsvpStatus.CONFIRMED, rsvpSource: RsvpSource.RSVP_FORM, rsvpAt: new Date('2024-11-22'), createdAt: new Date('2024-11-10'), updatedAt: new Date('2024-11-22') },
        { id: 'g5', eventId: 'e2', fullName: 'Pedro Sánchez', phone: '+52 55 5555 5555', rsvpStatus: RsvpStatus.PENDING, rsvpSource: RsvpSource.CSV, createdAt: new Date('2024-11-10'), updatedAt: new Date('2024-11-10') }
    ];

    // Mock Invitations
    private mockInvitations: Invitation[] = [
        { id: 'inv1', eventId: 'e1', guestId: 'g1', inviteCode: 'JL2025-001', guestCount: 2, inviteType: InviteType.FAMILY, landingUrl: 'https://monotickets.com/i/JL2025-001', qrToken: 'token1', status: InvitationStatus.DELIVERED, sentAt: new Date('2024-11-15'), deliveredAt: new Date('2024-11-15'), createdAt: new Date('2024-11-10'), updatedAt: new Date('2024-11-15') },
        { id: 'inv2', eventId: 'e1', guestId: 'g2', inviteCode: 'JL2025-002', guestCount: 1, inviteType: InviteType.STANDARD, landingUrl: 'https://monotickets.com/i/JL2025-002', qrToken: 'token2', status: InvitationStatus.SENT, sentAt: new Date('2024-11-15'), createdAt: new Date('2024-11-10'), updatedAt: new Date('2024-11-15') },
        { id: 'inv3', eventId: 'e2', guestId: 'g4', inviteCode: 'SG2025-001', guestCount: 3, inviteType: InviteType.VIP, landingUrl: 'https://monotickets.com/i/SG2025-001', qrToken: 'token3', status: InvitationStatus.DELIVERED, sentAt: new Date('2024-11-20'), deliveredAt: new Date('2024-11-20'), createdAt: new Date('2024-11-15'), updatedAt: new Date('2024-11-20') }
    ];

    // Get event guests
    getEventGuests(eventId: string, page: number = 1, limit: number = 10, filters?: any): Observable<{ guests: Guest[], total: number }> {
        let filtered = this.mockGuests.filter(g => g.eventId === eventId);

        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(g =>
                g.fullName.toLowerCase().includes(search) ||
                g.phone.includes(search)
            );
        }

        if (filters?.rsvpStatus) {
            filtered = filtered.filter(g => g.rsvpStatus === filters.rsvpStatus);
        }

        if (filters?.rsvpSource) {
            filtered = filtered.filter(g => g.rsvpSource === filters.rsvpSource);
        }

        const total = filtered.length;
        const start = (page - 1) * limit;
        const guests = filtered.slice(start, start + limit);

        return of({ guests, total }).pipe(delay(300));
    }

    // Get guest by ID
    getGuestById(eventId: string, guestId: string): Observable<Guest> {
        const guest = this.mockGuests.find(g => g.id === guestId && g.eventId === eventId);
        return of(guest!).pipe(delay(300));
    }

    // Create guest
    createGuest(eventId: string, guestData: any): Observable<Guest> {
        const newGuest: Guest = {
            id: `g${this.mockGuests.length + 1}`,
            eventId,
            ...guestData,
            rsvpStatus: RsvpStatus.PENDING,
            rsvpSource: RsvpSource.MANUAL,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.mockGuests.push(newGuest);
        this.saveGuestsToLocalStorage();
        return of(newGuest).pipe(delay(300));
    }

    // Update guest
    updateGuest(eventId: string, guestId: string, guestData: any): Observable<Guest> {
        const index = this.mockGuests.findIndex(g => g.id === guestId && g.eventId === eventId);
        if (index !== -1) {
            this.mockGuests[index] = { ...this.mockGuests[index], ...guestData, updatedAt: new Date() };
            this.saveGuestsToLocalStorage();
            return of(this.mockGuests[index]).pipe(delay(300));
        }
        return of(null as any).pipe(delay(300));
    }

    // Delete guest
    deleteGuest(eventId: string, guestId: string): Observable<void> {
        const index = this.mockGuests.findIndex(g => g.id === guestId && g.eventId === eventId);
        if (index !== -1) {
            this.mockGuests.splice(index, 1);
            this.saveGuestsToLocalStorage();
        }
        return of(void 0).pipe(delay(300));
    }

    // Upload CSV (simulated)
    uploadGuestsCSV(eventId: string, file: File): Observable<{ imported: number, errors: string[], guests: Guest[] }> {
        // Simulate CSV upload with 5 new guests
        const newGuests: Guest[] = [];
        for (let i = 1; i <= 5; i++) {
            const guest: Guest = {
                id: `g${this.mockGuests.length + i}`,
                eventId,
                fullName: `Invitado CSV ${i}`,
                phone: `+52 55 ${1000 + i}000 ${1000 + i}000`,
                email: `csv${i}@example.com`,
                rsvpStatus: RsvpStatus.PENDING,
                rsvpSource: RsvpSource.CSV,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            newGuests.push(guest);
            this.mockGuests.push(guest);
        }
        return of({ imported: 5, errors: [], guests: newGuests }).pipe(delay(1000));
    }

    // Get event invitations
    getEventInvitations(eventId: string, page: number = 1, limit: number = 10, filters?: any): Observable<{ invitations: Invitation[], total: number }> {
        let filtered = this.mockInvitations.filter(i => i.eventId === eventId);

        if (filters?.status) {
            filtered = filtered.filter(i => i.status === filters.status);
        }

        const total = filtered.length;
        const start = (page - 1) * limit;
        const invitations = filtered.slice(start, start + limit);

        return of({ invitations, total }).pipe(delay(300));
    }

    // Generate invitations
    generateInvitations(eventId: string, guestIds: string[]): Observable<{ generated: number, invitations: Invitation[] }> {
        const newInvitations: Invitation[] = [];
        guestIds.forEach((guestId, index) => {
            const invitation: Invitation = {
                id: `inv${this.mockInvitations.length + index + 1}`,
                eventId,
                guestId,
                inviteCode: `EV2025-${String(this.mockInvitations.length + index + 1).padStart(3, '0')}`,
                guestCount: 1,
                inviteType: InviteType.STANDARD,
                landingUrl: `https://monotickets.com/i/EV2025-${String(this.mockInvitations.length + index + 1).padStart(3, '0')}`,
                qrToken: `token${this.mockInvitations.length + index + 1}`,
                status: InvitationStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            newInvitations.push(invitation);
            this.mockInvitations.push(invitation);
        });
        this.saveInvitationsToLocalStorage();
        return of({ generated: newInvitations.length, invitations: newInvitations }).pipe(delay(500));
    }

    // Get invitation QR
    getInvitationQR(invitationId: string): Observable<string> {
        // Return mock QR data URL
        return of('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==').pipe(delay(300));
    }

    // Resend invitation
    resendInvitation(invitationId: string): Observable<void> {
        const index = this.mockInvitations.findIndex(i => i.id === invitationId);
        if (index !== -1) {
            this.mockInvitations[index].status = InvitationStatus.SENT;
            this.mockInvitations[index].sentAt = new Date();
            this.mockInvitations[index].updatedAt = new Date();
        }
        return of(void 0).pipe(delay(300));
    }
}

