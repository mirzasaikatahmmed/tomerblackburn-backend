import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateCostCodeCategoryDto } from './create-cost-code-category.dto';
import { QuestionType, UnitType } from 'generated/prisma/enums';

export class UpdateCostCodeCategoryDto extends PartialType(
  CreateCostCodeCategoryDto,
) {}

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

  @ApiProperty({ enum: QuestionType })
  questionType: QuestionType;

  @ApiProperty({ enum: UnitType })
  unitType: UnitType;
}

export class CostCodeCategoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Demolition',
  })
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'demolition',
  })
  slug: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Remove existing fixtures and prepare space',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Step number in estimator flow',
    example: 1,
  })
  stepNumber: number;

  @ApiProperty({
    description: 'Display order within step',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Related cost codes',
    type: [CostCodeSummaryDto],
    required: false,
  })
  costCodes?: CostCodeSummaryDto[];

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
