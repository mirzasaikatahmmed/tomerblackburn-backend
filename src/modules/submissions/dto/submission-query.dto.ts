import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { SubmissionStatus } from 'generated/prisma/enums';

export enum SubmissionSortField {
  NAME = 'name',
  DATE = 'date',
  TOTAL = 'total',
  PROJECT_TYPE = 'projectType',
  STATUS = 'status',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SubmissionDateRange {
  DAYS_30 = 30,
  DAYS_60 = 60,
  DAYS_90 = 90,
}

export class SubmissionQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by submission status',
    enum: SubmissionStatus,
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiPropertyOptional({
    description:
      'Sort field (name, date, total, projectType, status). Default: date',
    enum: SubmissionSortField,
    default: SubmissionSortField.DATE,
  })
  @IsOptional()
  @IsEnum(SubmissionSortField)
  sortBy?: SubmissionSortField = SubmissionSortField.DATE;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc). Default: desc',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description:
      'Filter by how recent the submission is (in days). Allowed values: 30, 60, 90',
    enum: SubmissionDateRange,
    example: SubmissionDateRange.DAYS_30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(SubmissionDateRange)
  dateRange?: SubmissionDateRange;

  @ApiPropertyOptional({
    description:
      'Include archived submissions in the result set (default: false)',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  includeArchived?: boolean = false;
}
