import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto, ServiceResponseDto } from './dto/update-service.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service',
    description: 'Creates a new service with optional image upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        serviceCategoryId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
          description: 'Service category ID (UUID)',
        },
        code: {
          type: 'string',
          example: 'FP',
          maxLength: 10,
          description: 'Unique code for service',
        },
        name: {
          type: 'string',
          example: 'Four Piece',
          maxLength: 100,
          description: 'Name of service',
        },
        fullDescription: {
          type: 'string',
          example: 'Toilet + Sink + Shower + Tub',
          description: 'Full description',
        },
        basePrice: {
          type: 'number',
          example: 15000.0,
          description: 'Base price',
        },
        markup: {
          type: 'number',
          example: 20.0,
          description: 'Markup percentage (e.g. 20 for 20%)',
        },
        clientPrice: {
          type: 'number',
          example: 18000.0,
          description: 'Client-facing price (basePrice + markup)',
        },
        isActive: {
          type: 'boolean',
          example: true,
          description: 'Active status',
        },
        displayOrder: {
          type: 'number',
          example: 1,
          description: 'Display order',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (optional)',
        },
      },
      required: ['serviceCategoryId', 'code', 'name', 'basePrice'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Service with this code already exists',
  })
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createServiceDto: CreateServiceDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.servicesService.create(createServiceDto, image);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all services',
    description:
      'Retrieve all services with optional filtering by active status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status (true/false)',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of services retrieved successfully',
    type: [ServiceResponseDto],
    schema: {
      example: {
        message: 'Services retrieved successfully',
        count: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            serviceCategoryId: '123e4567-e89b-12d3-a456-426614174001',
            code: 'FP',
            name: 'Four Piece',
            fullDescription: 'Toilet + Sink + Shower + Tub',
            basePrice: 15000.0,
            markup: 20.0,
            clientPrice: 18000.0,
            isActive: true,
            displayOrder: 1,
          },
        ],
      },
    },
  })
  findAll(@Query('isActive') isActive?: string) {
    const filter = isActive !== undefined ? isActive === 'true' : undefined;
    return this.servicesService.findAll(filter);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active services for customer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of active services',
    type: [ServiceResponseDto],
  })
  findActive() {
    return this.servicesService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service found',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
  })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get service by code' })
  @ApiParam({
    name: 'code',
    description: 'Service code (FP, TPS, TPT, TP)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service found',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
  })
  findByCode(@Param('code') code: string) {
    return this.servicesService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update service',
    description: 'Update an existing service with optional image upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        serviceCategoryId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
          description: 'Service category ID',
        },
        code: {
          type: 'string',
          example: 'FP',
          description: 'Unique code',
        },
        name: {
          type: 'string',
          example: 'Four Piece Deluxe',
          description: 'Name',
        },
        fullDescription: {
          type: 'string',
          example: 'Toilet + Sink + Shower + Tub with premium fixtures',
          description: 'Full description',
        },
        basePrice: {
          type: 'number',
          example: 18000.0,
          description: 'Base price',
        },
        markup: {
          type: 'number',
          example: 20.0,
          description: 'Markup percentage (e.g. 20 for 20%)',
        },
        clientPrice: {
          type: 'number',
          example: 21600.0,
          description: 'Client-facing price (basePrice + markup)',
        },
        isActive: {
          type: 'boolean',
          example: true,
          description: 'Active status',
        },
        displayOrder: {
          type: 'number',
          example: 1,
          description: 'Display order',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'New image file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Service with this code already exists',
  })
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.servicesService.update(id, updateServiceDto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service not found',
  })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
