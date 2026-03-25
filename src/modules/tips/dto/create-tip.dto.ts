import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTipDto {
  @ApiProperty({
    description:
      'Position/order of the tip (not unique, multiple tips can share a position)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  position: number;

  @ApiProperty({
    description: 'Tip message content',
    example: 'Always check measurements twice before cutting.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
