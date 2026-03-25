import { ApiProperty } from '@nestjs/swagger';

export class TipResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Position/order of the tip',
    example: 1,
  })
  position: number;

  @ApiProperty({
    description: 'Tip message content',
    example: 'Always check measurements twice before cutting.',
  })
  message: string;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
