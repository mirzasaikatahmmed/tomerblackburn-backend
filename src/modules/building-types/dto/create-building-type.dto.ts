import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBuildingTypeFieldDto } from './create-building-type-field.dto';

export class CreateBuildingTypeDto {
  @ApiProperty({
    description: 'Building type name',
    example: 'Single Family',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Price for this building type',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Whether this building type is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Display order for sorting',
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description:
      'Dynamic input fields shown when this building type is selected',
    type: [CreateBuildingTypeFieldDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBuildingTypeFieldDto)
  @IsOptional()
  fields?: CreateBuildingTypeFieldDto[];
}
