import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendDeliveryDto {
  @ApiProperty({
    description: 'Array of Invitation IDs to send',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  invitationIds: string[];
}
