import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmissionItemInputDto {
  @ApiProperty({
    description: 'Cost code ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  costCodeId: string;

  @ApiProperty({
    description: 'Selected option ID (for dropdown/tier selections)',
    required: false,
  })
  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @ApiProperty({
    description: 'Quantity (for user input items)',
    example: 50,
    default: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Unit price for this item',
    example: 15.0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    description: 'Whether this toggle item is enabled',
    default: true,
  })
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({
    description: 'User input value (for user input items like sqft)',
    example: '150',
    required: false,
  })
  @IsString()
  @IsOptional()
  userInputValue?: string;

  @ApiProperty({
    description: 'Notes for this item',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmissionBuildingTypeFieldValueInputDto {
  @ApiProperty({
    description: 'Building type field ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @ApiProperty({
    description: 'Value for the building type field',
    example: '3',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Client full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  clientEmail: string;

  @ApiProperty({
    description: 'Client phone number',
    example: '(312) 555-1234',
  })
  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @ApiProperty({
    description: 'Project address',
    example: '123 Main St, Chicago, IL',
  })
  @IsString()
  @IsNotEmpty()
  projectAddress: string;

  @ApiProperty({
    description: 'Project zip code',
    example: '60601',
    required: false,
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    description: 'Desired project start date',
    example: '2026-04-01',
    required: false,
  })
  @IsString()
  @IsOptional()
  desiredStartDate?: string;

  @ApiProperty({
    description: 'Building type',
    example: 'Single Family',
    enum: ['Single Family', 'Condo', 'Townhome', 'Multi-Unit'],
    required: false,
  })
  @IsString()
  @IsOptional()
  buildingType?: string;

  @ApiProperty({
    description: 'Building type ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  buildingTypeId?: string;

  @ApiProperty({
    description: 'Dynamic building type field values',
    type: [SubmissionBuildingTypeFieldValueInputDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionBuildingTypeFieldValueInputDto)
  @IsOptional()
  buildingTypeFieldValues?: SubmissionBuildingTypeFieldValueInputDto[];

  @ApiProperty({
    description: 'Base price for the service',
    example: 15000.0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Markup percentage applied to base price (e.g. 20 for 20%)',
    example: 20.0,
    default: 0,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  markup?: number;

  @ApiProperty({
    description: 'Client-facing price (basePrice + markup)',
    example: 18000.0,
    default: 0,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  clientPrice?: number;

  @ApiProperty({
    description: 'Total of additional items',
    example: 5000.0,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  additionalItemsTotal?: number;

  @ApiProperty({
    description: 'Total amount (base + additional)',
    example: 20000.0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    description: 'Project notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectNotes?: string;

  @ApiProperty({
    description: 'Additional details',
    required: false,
  })
  @IsString()
  @IsOptional()
  additionalDetails?: string;

  @ApiProperty({
    description: 'Submission items',
    type: [SubmissionItemInputDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionItemInputDto)
  @IsOptional()
  items?: SubmissionItemInputDto[];
}
