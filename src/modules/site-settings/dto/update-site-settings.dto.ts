import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSiteSettingsDto } from './create-site-settings.dto';

export class UpdateSiteSettingsDto extends PartialType(CreateSiteSettingsDto) {}

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

export class SiteSettingsResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Site title',
    example: 'BBurn Builders',
  })
  siteTitle: string;

  @ApiProperty({
    description: 'Site description',
    required: false,
  })
  siteDescription?: string;

  @ApiProperty({
    description: 'Logo image ID',
    required: false,
  })
  logoImageId?: string;

  @ApiProperty({
    description: 'Logo image details',
    type: FileInstanceDto,
    required: false,
  })
  logoImage?: FileInstanceDto;

  @ApiProperty({
    description: 'Contact phone number',
    required: false,
  })
  contactNumber?: string;

  @ApiProperty({
    description: 'Contact email',
    required: false,
  })
  contactEmail?: string;

  @ApiProperty({
    description: 'Facebook URL',
    required: false,
  })
  facebookUrl?: string;

  @ApiProperty({
    description: 'Instagram URL',
    required: false,
  })
  instagramUrl?: string;

  @ApiProperty({
    description: 'Twitter URL',
    required: false,
  })
  twitterUrl?: string;

  @ApiProperty({
    description: 'CTA banner text displayed in the top bar',
    example: 'Get Your Free Live Estimate Now!',
    required: false,
  })
  ctaBannerText?: string;

  @ApiProperty({
    description: 'Whether the CTA banner is visible',
    example: true,
  })
  ctaBannerEnabled: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
