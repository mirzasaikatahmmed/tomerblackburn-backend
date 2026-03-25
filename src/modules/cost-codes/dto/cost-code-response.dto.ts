import { ApiProperty } from '@nestjs/swagger';
import { QuestionType, UnitType } from 'generated/prisma/enums';

class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false })
  stepNumber?: number;
}

class CostCodeOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  optionName: string;

  @ApiProperty({ required: false })
  optionValue?: string;

  @ApiProperty()
  priceModifier: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isActive: boolean;
}

export class CostCodeResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Category ID',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Cost code',
    example: 'FP-D-1',
  })
  code: string;

  @ApiProperty({
    description: 'Cost code name',
    example: 'Floor Tile Installation',
  })
  name: string;

  @ApiProperty({
    description: 'Tips for this cost code',
    example: ['Measure twice, cut once'],
    required: false,
    type: [String],
  })
  tips?: string[];

  @ApiProperty({
    description: 'Description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Base price',
    example: 500.0,
  })
  basePrice: number;

  @ApiProperty({
    description: 'Markup percentage (e.g. 20 for 20%)',
    example: 20.0,
  })
  markup: number;

  @ApiProperty({
    description: 'Client-facing price (basePrice + markup)',
    example: 600.0,
  })
  clientPrice: number;

  @ApiProperty({
    description: 'Unit type for pricing calculation',
    enum: UnitType,
    example: UnitType.FIXED,
  })
  unitType: UnitType;

  @ApiProperty({
    description: 'Question type (determines UI behavior)',
    enum: QuestionType,
    example: QuestionType.WHITE,
  })
  questionType: QuestionType;

  @ApiProperty({
    description: 'Step number for organizing cost codes in workflow',
    example: 1,
  })
  step: number;

  @ApiProperty({
    description: 'Display order within category',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Whether included in base price',
    example: false,
  })
  isIncludedInBase: boolean;

  @ApiProperty({
    description: 'Requires quantity input',
    example: false,
  })
  requiresQuantity: boolean;

  @ApiProperty({
    description: 'Is optional',
    example: false,
  })
  isOptional: boolean;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description:
      'If true, this cost code is branch-only: shown in estimator for conditional logic but excluded from Buildertrend/Excel export.',
    example: false,
    required: false,
  })
  excludeFromExport?: boolean;

  @ApiProperty({
    description: 'Category details',
    type: CategoryDto,
    required: false,
  })
  category?: CategoryDto;

  @ApiProperty({
    description: 'Cost code options',
    type: [CostCodeOptionDto],
    required: false,
  })
  options?: CostCodeOptionDto[];

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
