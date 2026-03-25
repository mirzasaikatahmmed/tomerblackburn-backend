import { ApiProperty } from '@nestjs/swagger';

class CostCodeSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  markup: number;

  @ApiProperty()
  clientPrice: number;

  @ApiProperty()
  colorTag: string;
}

class CategorySummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class CostCodeOptionResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Cost code ID',
  })
  costCodeId: string;

  @ApiProperty({
    description: 'Option name',
    example: 'Mid-Range',
  })
  optionName: string;

  @ApiProperty({
    description: 'Option value',
    example: '24"',
    required: false,
  })
  optionValue?: string;

  @ApiProperty({
    description: 'Price modifier (added to base)',
    example: 500.0,
  })
  priceModifier: number;

  @ApiProperty({
    description: 'Final calculated price',
    example: 1000.0,
  })
  finalPrice: number;

  @ApiProperty({
    description: 'Is this the default option',
    example: false,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Display order',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Cost code details',
    type: CostCodeSummaryDto,
    required: false,
  })
  costCode?: {
    id: string;
    code: string;
    name: string;
    basePrice: number;
    colorTag: string;
    category?: CategorySummaryDto;
  };

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
