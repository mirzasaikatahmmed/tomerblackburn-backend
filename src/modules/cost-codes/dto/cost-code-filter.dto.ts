import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, UnitType } from 'generated/prisma/enums';

export class CostCodeFilterDto {
  @ApiProperty({
    description: 'Filter by category ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Filter by service ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({
    description: 'Filter by question type (UI behavior)',
    required: false,
    enum: QuestionType,
  })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiProperty({
    description: 'Filter by unit type',
    required: false,
    enum: UnitType,
  })
  @IsEnum(UnitType)
  @IsOptional()
  unitType?: UnitType;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by included in base price',
    required: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isIncludedInBase?: boolean;

  @ApiProperty({
    description: 'Include cost code options in response',
    required: false,
    default: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  includeOptions?: boolean = true;

  @ApiProperty({
    description: 'Include category details in response',
    required: false,
    default: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  includeCategory?: boolean = true;

  @ApiProperty({
    description: 'Include service details in response',
    required: false,
    default: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  includeServiceRelation?: boolean = true;
}
