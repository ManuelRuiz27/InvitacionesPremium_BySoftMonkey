import { IsArray, IsUUID, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';

export class SendInvitationsDto {
    @ApiProperty({
        description: 'Array of invitation IDs to send',
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    invitationIds: string[];

    @ApiPropertyOptional({
        description: 'Delivery method',
        enum: ['SMS', 'EMAIL', 'WHATSAPP'],
        example: 'SMS',
    })
    @IsOptional()
    method?: string;
}
