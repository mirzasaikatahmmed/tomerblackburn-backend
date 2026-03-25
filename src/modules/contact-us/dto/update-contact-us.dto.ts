import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateContactUsDto } from './create-contact-us.dto';

export class UpdateContactUsDto extends PartialType(CreateContactUsDto) {
  @ApiProperty({
    description: 'Whether the message has been read',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
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

class ContactMediaResponseDto {
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

export class ContactUsResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '(312) 555-1234',
  })
  phone: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main St',
  })
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'Chicago',
  })
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'IL',
  })
  state: string;

  @ApiProperty({
    description: 'Zip code',
    example: '60601',
  })
  zipCode: string;

  @ApiProperty({
    description: 'Message',
    example: 'I need a complete bathroom remodel for my master bathroom.',
  })
  message: string;

  @ApiProperty({
    description: 'Project start date',
    example: '2024-03-15T00:00:00.000Z',
    required: false,
  })
  projectStartDate?: Date;

  @ApiProperty({
    description: 'Whether the message has been read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Attached media files (photos/videos)',
    type: [ContactMediaResponseDto],
    required: false,
  })
  contactMedia?: ContactMediaResponseDto[];
}
