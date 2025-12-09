import { IsUUID, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateInvitationsDto {
    @ApiProperty({
        description: 'Array of guest IDs to generate invitations for',
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    guestIds: string[];
}
