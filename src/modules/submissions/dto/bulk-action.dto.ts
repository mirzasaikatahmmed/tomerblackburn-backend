import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BulkSubmissionsByIdsDto {
  @ApiProperty({
    description: 'Array of submission IDs to apply the bulk action to',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one submission ID is required' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];
}
