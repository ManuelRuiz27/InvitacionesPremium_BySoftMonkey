import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlannerSettingsDto } from './dto/update-planner-settings.dto';
import { InviteMode, UserRole } from '@prisma/client';

@Injectable()
export class PlannersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const planner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        brandDefaults: true,
        preferredInviteMode: true,
        createdAt: true,
        updatedAt: true,
        eventsAsPlanner: {
          select: { id: true },
        },
      },
    });

    if (!planner) {
      throw new NotFoundException('Planner not found');
    }

    return {
      id: planner.id,
      email: planner.email,
      fullName: planner.fullName,
      role: planner.role,
      brandDefaults: planner.brandDefaults ?? null,
      preferredInviteMode: planner.preferredInviteMode ?? InviteMode.PDF,
      createdAt: planner.createdAt,
      updatedAt: planner.updatedAt,
      eventsCount: planner.eventsAsPlanner.length,
    };
  }

  async getSettings(
    userId: string,
    requestingUser: { id: string; role: UserRole },
  ) {
    this.assertOwnership(userId, requestingUser);
    const planner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        brandDefaults: true,
        preferredInviteMode: true,
      },
    });

    if (!planner) {
      throw new NotFoundException('Planner not found');
    }

    return {
      id: planner.id,
      brandDefaults: planner.brandDefaults ?? null,
      preferredInviteMode: planner.preferredInviteMode ?? InviteMode.PDF,
    };
  }

  async updateSettings(
    userId: string,
    requestingUser: { id: string; role: UserRole },
    dto: UpdatePlannerSettingsDto,
  ) {
    this.assertOwnership(userId, requestingUser);

    const data: any = {};
    if (dto.brandDefaults !== undefined) {
      data.brandDefaults = dto.brandDefaults;
    }
    if (dto.preferredInviteMode !== undefined) {
      data.preferredInviteMode = dto.preferredInviteMode;
    }

    const planner = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        brandDefaults: true,
        preferredInviteMode: true,
        updatedAt: true,
      },
    });

    return {
      id: planner.id,
      brandDefaults: planner.brandDefaults ?? null,
      preferredInviteMode: planner.preferredInviteMode ?? InviteMode.PDF,
      updatedAt: planner.updatedAt,
    };
  }

  private assertOwnership(
    targetUserId: string,
    user: { id: string; role: UserRole },
  ) {
    if (!user) {
      throw new ForbiddenException('User context required');
    }

    if (user.role === UserRole.DIRECTOR_GLOBAL) {
      return;
    }

    if (user.role !== UserRole.PLANNER || user.id !== targetUserId) {
      throw new ForbiddenException(
        'You do not have permission to manage these settings',
      );
    }
  }
}
