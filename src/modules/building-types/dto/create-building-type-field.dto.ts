import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBuildingTypeFieldDto {
  @ApiProperty({
    description: 'Field ID (for updates - omit when creating new field)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Display label for the field',
    example: 'Number of Units',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'HTML input type',
    example: 'text',
    enum: ['text', 'number', 'email', 'tel', 'textarea'],
    default: 'text',
  })
  @IsString()
  @IsIn(['text', 'number', 'email', 'tel', 'textarea'])
  @IsOptional()
  fieldType?: string;

  @ApiProperty({
    description: 'Placeholder text for the input',
    example: 'Enter number of units',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiProperty({
    description: 'Whether the field is required',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({
    description: 'Display order',
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
