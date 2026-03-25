import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateServiceCategoryDto {
  @ApiProperty({
    description: 'Project type ID (foreign key)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  projectTypeId: string;

  @ApiProperty({
    description: 'Service category name',
    example: 'Bathroom Type',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Detailed description of the service category',
    example: 'Different types of bathroom configurations',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file upload for the service category',
    required: false,
  })
  @IsOptional()
  image?: any;

  @ApiProperty({
    description:
      'Optional: Provide an existing file instance ID instead of uploading a new image',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageId?: string;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 0,
    default: 0,
    required: false,
  })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 0))
  @IsNumber()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Whether this service category is active',
    default: true,
    required: false,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return true;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
