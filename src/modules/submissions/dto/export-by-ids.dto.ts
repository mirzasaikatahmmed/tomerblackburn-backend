import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class ExportSubmissionsByIdsDto {
  @ApiProperty({
    description: 'Array of submission IDs to export',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one ID is required' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];
}
