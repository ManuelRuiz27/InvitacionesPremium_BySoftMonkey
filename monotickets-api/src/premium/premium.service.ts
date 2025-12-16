import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePremiumConfigDto } from './dto/update-premium-config.dto';
import { UserRole } from '@prisma/client';
import { DEFAULT_PREMIUM_CONFIG } from './premium.constants';
import { AuthenticatedUser } from '../auth/types/authenticated-user.interface';

@Injectable()
export class PremiumService {
  constructor(private prisma: PrismaService) {}

  async getConfig(eventId: string, user: AuthenticatedUser) {
    await this.ensureAccess(eventId, user);
    const config = await this.prisma.premiumConfig.findUnique({
      where: { eventId },
    });

    if (!config) {
      return { eventId, ...DEFAULT_PREMIUM_CONFIG };
    }

    return {
      eventId,
      effect: config.effect,
      colors: config.colors,
      sections: config.sections,
      reduceMotionDefault: config.reduceMotionDefault,
    };
  }

  async updateConfig(
    eventId: string,
    user: AuthenticatedUser,
    dto: UpdatePremiumConfigDto,
  ) {
    await this.ensureAccess(eventId, user, true);

    const config = await this.prisma.premiumConfig.upsert({
      where: { eventId },
      update: {
        effect: dto.effect,
        colors: dto.colors,
        sections: dto.sections,
        reduceMotionDefault: dto.reduceMotionDefault ?? false,
      },
      create: {
        eventId,
        effect: dto.effect,
        colors: dto.colors,
        sections: dto.sections,
        reduceMotionDefault: dto.reduceMotionDefault ?? false,
      },
    });

    return {
      eventId: config.eventId,
      effect: config.effect,
      colors: config.colors,
      sections: config.sections,
      reduceMotionDefault: config.reduceMotionDefault,
    };
  }

  private async ensureAccess(
    eventId: string,
    user: AuthenticatedUser,
    plannerOnly = false,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (!user) {
      throw new ForbiddenException('User context required');
    }

    if (!plannerOnly && user.role === UserRole.DIRECTOR_GLOBAL) {
      return event;
    }

    if (user.role === UserRole.PLANNER && event.plannerId === user.id) {
      return event;
    }

    throw new ForbiddenException(
      'You do not have permission to manage this premium configuration',
    );
  }
}
