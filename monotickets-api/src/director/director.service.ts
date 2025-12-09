import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FiltersDto } from './dto/filters.dto';

@Injectable()
export class DirectorService {
    constructor(private prisma: PrismaService) { }

    async getDashboard(filters?: FiltersDto) {
        const whereClause: any = {};

        if (filters?.dateFrom || filters?.dateTo) {
            whereClause.date = {};
            if (filters.dateFrom) {
                whereClause.date.gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                whereClause.date.lte = new Date(filters.dateTo);
            }
        }

        if (filters?.plannerId) {
            whereClause.plannerId = filters.plannerId;
        }

        // Total events
        const totalEvents = await this.prisma.event.count({
            where: { ...whereClause, active: true },
        });

        // Total planners
        const totalPlanners = await this.prisma.user.count({
            where: { role: 'PLANNER', active: true },
        });

        // Total guests
        const totalGuests = await this.prisma.guest.count({
            where: {
                event: whereClause,
            },
        });

        // Total invitations
        const totalInvitations = await this.prisma.invitation.count({
            where: {
                event: whereClause,
            },
        });

        // Total scans
        const totalScans = await this.prisma.scan.count({
            where: {
                event: whereClause,
            },
        });

        // Confirmed guests
        const confirmedGuests = await this.prisma.guest.count({
            where: {
                event: whereClause,
                rsvpStatus: 'CONFIRMED',
            },
        });

        // Recent events
        const recentEvents = await this.prisma.event.findMany({
            where: { ...whereClause, active: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                planner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        guests: true,
                        invitations: true,
                        scans: true,
                    },
                },
            },
        });

        // Top planners by events
        const topPlanners = await this.prisma.user.findMany({
            where: { role: 'PLANNER', active: true },
            take: 5,
            include: {
                _count: {
                    select: {
                        eventsAsPlanner: true,
                    },
                },
            },
            orderBy: {
                eventsAsPlanner: {
                    _count: 'desc',
                },
            },
        });

        return {
            metrics: {
                totalEvents,
                totalPlanners,
                totalGuests,
                totalInvitations,
                totalScans,
                confirmedGuests,
                attendanceRate: totalGuests > 0 ? (totalScans / totalGuests) * 100 : 0,
                confirmationRate: totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0,
            },
            recentEvents,
            topPlanners: topPlanners.map(p => ({
                id: p.id,
                fullName: p.fullName,
                email: p.email,
                eventsCount: p._count.eventsAsPlanner,
            })),
        };
    }

    async getPlanners() {
        const planners = await this.prisma.user.findMany({
            where: { role: 'PLANNER', active: true },
            include: {
                _count: {
                    select: {
                        eventsAsPlanner: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return planners.map(p => ({
            id: p.id,
            fullName: p.fullName,
            email: p.email,
            role: p.role,
            eventsCount: p._count.eventsAsPlanner,
            createdAt: p.createdAt,
        }));
    }

    async getPlannerDetail(plannerId: string) {
        const planner = await this.prisma.user.findUnique({
            where: { id: plannerId },
            include: {
                eventsAsPlanner: {
                    where: { active: true },
                    include: {
                        _count: {
                            select: {
                                guests: true,
                                invitations: true,
                                scans: true,
                            },
                        },
                    },
                    orderBy: {
                        date: 'desc',
                    },
                },
            },
        });

        if (!planner) {
            return null;
        }

        return {
            id: planner.id,
            fullName: planner.fullName,
            email: planner.email,
            role: planner.role,
            createdAt: planner.createdAt,
            events: planner.eventsAsPlanner,
            eventsCount: planner.eventsAsPlanner.length,
        };
    }

    async getPlannerMetrics(plannerId: string) {
        const totalEvents = await this.prisma.event.count({
            where: { plannerId, active: true },
        });

        const totalGuests = await this.prisma.guest.count({
            where: {
                event: {
                    plannerId,
                },
            },
        });

        const totalInvitations = await this.prisma.invitation.count({
            where: {
                event: {
                    plannerId,
                },
            },
        });

        const totalScans = await this.prisma.scan.count({
            where: {
                event: {
                    plannerId,
                },
            },
        });

        const confirmedGuests = await this.prisma.guest.count({
            where: {
                event: {
                    plannerId,
                },
                rsvpStatus: 'CONFIRMED',
            },
        });

        return {
            totalEvents,
            totalGuests,
            totalInvitations,
            totalScans,
            confirmedGuests,
            attendanceRate: totalGuests > 0 ? (totalScans / totalGuests) * 100 : 0,
            confirmationRate: totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0,
        };
    }

    async getGlobalEvents(filters?: FiltersDto) {
        const whereClause: any = { active: true };

        if (filters?.dateFrom || filters?.dateTo) {
            whereClause.date = {};
            if (filters.dateFrom) {
                whereClause.date.gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                whereClause.date.lte = new Date(filters.dateTo);
            }
        }

        if (filters?.plannerId) {
            whereClause.plannerId = filters.plannerId;
        }

        const events = await this.prisma.event.findMany({
            where: whereClause,
            include: {
                planner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        guests: true,
                        invitations: true,
                        scans: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        return events;
    }

    async getStats() {
        const totalUsers = await this.prisma.user.count({
            where: { active: true },
        });

        const totalEvents = await this.prisma.event.count({
            where: { active: true },
        });

        const totalGuests = await this.prisma.guest.count();

        const totalInvitations = await this.prisma.invitation.count();

        const totalScans = await this.prisma.scan.count();

        // Events by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const eventsByMonth = await this.prisma.event.groupBy({
            by: ['date'],
            where: {
                date: {
                    gte: sixMonthsAgo,
                },
                active: true,
            },
            _count: true,
        });

        return {
            totalUsers,
            totalEvents,
            totalGuests,
            totalInvitations,
            totalScans,
            eventsByMonth,
        };
    }
}
