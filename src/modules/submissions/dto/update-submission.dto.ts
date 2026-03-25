import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSubmissionDto } from './create-submission.dto';
import { QuestionType, SubmissionStatus } from 'generated/prisma/enums';

export class UpdateSubmissionDto extends PartialType(
  OmitType(CreateSubmissionDto, [
    'serviceId',
    'items',
    'buildingTypeFieldValues',
  ] as const),
) {
  @ApiProperty({
    description: 'Submission status',
    enum: SubmissionStatus,
    required: false,
  })
  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;
}

class FileInstanceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  mimeType: string;
}

class ServiceSummaryDto {
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
}

class CostCodeSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;
}

class CostCodeOptionSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  optionName: string;

  @ApiProperty()
  priceModifier: number;
}

class SubmissionItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  costCodeId: string;

  @ApiProperty({ required: false })
  selectedOptionId?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty({ enum: QuestionType, required: false })
  questionType?: QuestionType;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty({ required: false })
  userInputValue?: string;

  @ApiProperty({ required: false })
  itemName?: string;

  @ApiProperty({ required: false })
  itemDescription?: string;

  @ApiProperty({ required: false })
  selectedOptionName?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ type: CostCodeSummaryDto, required: false })
  costCode?: CostCodeSummaryDto;

  @ApiProperty({ type: CostCodeOptionSummaryDto, required: false })
  selectedOption?: CostCodeOptionSummaryDto;
}

class SubmissionMediaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileInstanceId: string;

  @ApiProperty()
  mediaType: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty({ type: FileInstanceDto, required: false })
  fileInstance?: FileInstanceDto;
}

export class SubmissionResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Submission number',
    example: 'EST-2026-001',
  })
  submissionNumber: string;

  @ApiProperty({
    description: 'Service ID',
  })
  serviceId: string;

  @ApiProperty({
    description: 'Client name',
    example: 'John Doe',
  })
  clientName: string;

  @ApiProperty({
    description: 'Client email',
    example: 'john.doe@example.com',
  })
  clientEmail: string;

  @ApiProperty({
    description: 'Client phone',
    example: '(312) 555-1234',
  })
  clientPhone: string;

  @ApiProperty({
    description: 'Project address',
    example: '123 Main St, Chicago, IL',
  })
  projectAddress: string;

  @ApiProperty({
    description: 'Project zip code',
    required: false,
  })
  zipCode?: string;

  @ApiProperty({
    description: 'Base price',
    example: 15000.0,
  })
  basePrice: number;

  @ApiProperty({
    description: 'Markup percentage (e.g. 20 for 20%)',
    example: 20.0,
  })
  markup: number;

  @ApiProperty({
    description: 'Client-facing price (basePrice + markup)',
    example: 18000.0,
  })
  clientPrice: number;

  @ApiProperty({
    description: 'Additional items total',
    example: 5000.0,
  })
  additionalItemsTotal: number;

  @ApiProperty({
    description: 'Total amount',
    example: 20000.0,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Submission status',
    enum: SubmissionStatus,
    example: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @ApiProperty({
    description: 'Whether the submission has been archived',
    example: false,
  })
  isArchived: boolean;

  @ApiProperty({
    description: 'Project notes',
    required: false,
  })
  projectNotes?: string;

  @ApiProperty({
    description: 'Additional details',
    required: false,
  })
  additionalDetails?: string;

  @ApiProperty({
    description: 'Submitted at timestamp',
  })
  submittedAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Reviewed at timestamp',
    required: false,
  })
  reviewedAt?: Date;

  @ApiProperty({
    description: 'Completed at timestamp',
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Service details',
    type: ServiceSummaryDto,
    required: false,
  })
  service?: ServiceSummaryDto;

  @ApiProperty({
    description: 'Submission items',
    type: [SubmissionItemResponseDto],
    required: false,
  })
  submissionItems?: SubmissionItemResponseDto[];

  @ApiProperty({
    description: 'Submission media',
    type: [SubmissionMediaResponseDto],
    required: false,
  })
  submissionMedia?: SubmissionMediaResponseDto[];
}
