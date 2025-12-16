import { IsArray, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPartialEntryDto {
  @ApiProperty({
    description: 'Invitation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  invitationId: string;

  @ApiProperty({
    description: 'Array of names of people who are entering',
    example: ['Juan Pérez', 'María García'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  enteredNames: string[];

  @ApiProperty({
    description: 'ID of the staff member scanning',
    example: '456e7890-e89b-12d3-a456-426614174111',
  })
  @IsString()
  @IsNotEmpty()
  scannedBy: string;
}
