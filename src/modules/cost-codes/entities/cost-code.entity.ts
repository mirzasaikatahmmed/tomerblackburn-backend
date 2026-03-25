import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client-runtime-utils';
import { CostCode } from 'generated/prisma/client';

export class CostCodeEntity implements CostCode {
  @ApiProperty()
  id: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  serviceId: string | null;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  elies: string | null;

  @ApiProperty({ required: false })
  tips: string[];

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  basePrice: Decimal;

  @ApiProperty()
  markup: Decimal;

  @ApiProperty()
  clientPrice: Decimal;

  @ApiProperty()
  unitType: CostCode['unitType'];

  @ApiProperty()
  questionType: CostCode['questionType'];

  @ApiProperty()
  step: number;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isIncludedInBase: boolean;

  @ApiProperty()
  requiresQuantity: boolean;

  @ApiProperty()
  isOptional: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false, nullable: true })
  parentCostCodeId: string | null;

  @ApiProperty({ required: false, nullable: true })
  showWhenParentValue: string | null;

  @ApiProperty({ required: false, nullable: true })
  nestedInputType: string | null;

  @ApiProperty()
  excludeFromExport: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
