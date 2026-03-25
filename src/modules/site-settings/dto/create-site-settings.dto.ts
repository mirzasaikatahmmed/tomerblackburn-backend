import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateSiteSettingsDto {
  @ApiProperty({
    description: 'Site title',
    example: 'BBurn Builders',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  siteTitle: string;

  @ApiProperty({
    description: 'Site description',
    example: 'Premium bathroom remodeling services in Chicago',
    required: false,
  })
  @IsString()
  @IsOptional()
  siteDescription?: string;

  @ApiProperty({
    description: 'Logo file instance ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  logoImageId?: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '(312) 555-1234',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'info@bburnbuilders.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({
    description: 'Business location/address',
    example: '123 Main Street, Chicago, IL 60601',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Alternative address field',
    example: '123 Main Street, Chicago, IL 60601',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Facebook URL',
    example: 'https://facebook.com/bburnbuilders',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  facebookUrl?: string;

  @ApiProperty({
    description: 'Instagram URL',
    example: 'https://instagram.com/bburnbuilders',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  instagramUrl?: string;

  @ApiProperty({
    description: 'Twitter URL',
    example: 'https://twitter.com/bburnbuilders',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  twitterUrl?: string;

  @ApiProperty({
    description: 'CTA banner text displayed in the top bar',
    example: 'Get Your Free Live Estimate Now!',
    required: false,
  })
  @IsString()
  @IsOptional()
  ctaBannerText?: string;

  @ApiProperty({
    description: 'Whether the CTA banner is visible',
    example: true,
    required: false,
  })
  @IsOptional()
  ctaBannerEnabled?: boolean;
}
