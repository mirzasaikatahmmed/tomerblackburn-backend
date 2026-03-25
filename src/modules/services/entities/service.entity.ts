import { ApiProperty } from '@nestjs/swagger';
import { Service } from 'generated/prisma/client';

export class ServiceEntity implements Service {
  @ApiProperty()
  id: string;

  @ApiProperty()
  serviceCategoryId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  shortDescription: string | null;

  @ApiProperty()
  fullDescription: string | null;

  @ApiProperty()
  basePrice: any;

  @ApiProperty()
  markup: any;

  @ApiProperty()
  clientPrice: any;

  @ApiProperty()
  imageFileId: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
