import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, UnitType } from 'generated/prisma/enums';

export class CreateCostCodeDto {
  @ApiProperty({
    description: 'Category ID this cost code belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Service ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({
    description: 'Unique cost code',
    example: 'FP-D-1',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Cost code name/title',
    example: 'Floor Tile Installation',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Elies name for this cost code',
    example: 'Elies value',
    required: false,
  })
  @IsString()
  @IsOptional()
  elies?: string;

  @ApiProperty({
    description: 'Tips for this cost code (array format)',
    example: ['Measure twice, cut once', 'Confirm subfloor is level'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tips?: string[];

  @ApiProperty({
    description: 'Detailed description of the work',
    example: 'Installation of floor tiles including mortar, grout, and labor',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Base price for this cost code',
    example: 500.0,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @ApiProperty({
    description: 'Markup percentage applied to base price (e.g. 20 for 20%)',
    example: 20.0,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  markup?: number;

  @ApiProperty({
    description:
      'Client-facing price (basePrice + markup). Auto-calculated if not provided.',
    example: 600.0,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  clientPrice?: number;

  @ApiProperty({
    description: 'Unit type for pricing calculation',
    enum: UnitType,
    enumName: 'UnitType',
    example: UnitType.FIXED,
    default: UnitType.FIXED,
  })
  @IsEnum(UnitType)
  @IsOptional()
  unitType?: UnitType;

  @ApiProperty({
    description: 'Question type determines UI behavior (color-coded in admin)',
    enum: QuestionType,
    enumName: 'QuestionType',
    example: QuestionType.WHITE,
    default: QuestionType.WHITE,
  })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiProperty({
    description: 'Step number for organizing cost codes in workflow',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  step?: number;

  @ApiProperty({
    description: 'Display order within category',
    example: 1,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Whether this cost is included in the base price',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isIncludedInBase?: boolean;

  @ApiProperty({
    description: 'Whether this cost code requires quantity input',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresQuantity?: boolean;

  @ApiProperty({
    description: 'Whether this cost code is optional (can be toggled on/off)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @ApiProperty({
    description: 'Whether this cost code is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Parent cost code ID for nested questions',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentCostCodeId?: string;

  @ApiProperty({
    description:
      'Condition to show this nested question (true/false/optionId/ANY)',
    example: 'true',
    required: false,
  })
  @IsString()
  @IsOptional()
  showWhenParentValue?: string;

  @ApiProperty({
    description: 'Type of nested input',
    example: 'QUANTITY',
    enum: ['QUANTITY', 'DROPDOWN', 'CUSTOM_PRICE', 'NONE'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEnum(['QUANTITY', 'DROPDOWN', 'CUSTOM_PRICE', 'NONE'], {
    message:
      'nestedInputType must be one of: QUANTITY, DROPDOWN, CUSTOM_PRICE, NONE',
  })
  nestedInputType?: string;

  @ApiProperty({
    description:
      'If true, this question is for branching/conditional logic only: it appears in the estimator but is not exported to Buildertrend (no cost line). Use for questions like "Relocating Plumbing?" that only control which follow-up questions show.',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  excludeFromExport?: boolean;
}
