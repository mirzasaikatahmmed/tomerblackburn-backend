import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  serviceCategoryId: string;

  @ApiProperty({
    description: 'Unique code for service',
    example: 'FP',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @ApiProperty({
    description: 'Name of service',
    example: 'Four Piece',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Short description displayed on cards',
    example: 'Toilet + Sink + Shower + Tub',
    required: false,
  })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({
    description: 'Full detailed description of what is included',
    example:
      'Complete bathroom renovation including toilet, sink/vanity, shower, and bathtub installation.',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullDescription?: string;

  @ApiProperty({
    description: 'Base price for this service (displayed on cards)',
    example: 15000.0,
    minimum: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Markup percentage applied to base price (e.g. 20 for 20%)',
    example: 20.0,
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  markup?: number;

  @ApiProperty({
    description:
      'Client-facing price (basePrice + markup). Auto-calculated if not provided.',
    example: 18000.0,
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  clientPrice?: number;

  @ApiProperty({
    description: 'File instance ID for service image (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageFileId?: string;

  @ApiProperty({
    description: 'Whether this service is active and visible to customers',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Display order for sorting (lower numbers appear first)',
    example: 1,
    default: 0,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  displayOrder?: number;
}
