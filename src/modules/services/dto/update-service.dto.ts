import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

class FileInstanceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  mimeType: string;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

export class ServiceResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Service category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceCategoryId: string;

  @ApiProperty({
    description: 'Service code',
    example: 'FP',
  })
  code: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Four Piece',
  })
  name: string;

  @ApiProperty({
    description: 'Short description displayed on cards',
    example: 'Toilet + Sink + Shower + Tub',
    required: false,
  })
  shortDescription?: string;

  @ApiProperty({
    description: 'Full detailed description',
    example:
      'Complete bathroom renovation including toilet, sink/vanity, shower, and bathtub installation.',
    required: false,
  })
  fullDescription?: string;

  @ApiProperty({
    description: 'Base price',
    example: 15000.0,
  })
  basePrice: number;

  @ApiProperty({
    description: 'Markup percentage (e.g. 20 for 20%)',
    example: 20.0,
  })
  markup: number;

  @ApiProperty({
    description: 'Client-facing price (basePrice + markup)',
    example: 18000.0,
  })
  clientPrice: number;

  @ApiProperty({
    description: 'Image file ID',
    required: false,
  })
  imageFileId?: string;

  @ApiProperty({
    description: 'Image file details',
    type: FileInstanceDto,
    required: false,
  })
  imageFile?: FileInstanceDto;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Display order',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
