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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ServiceCategoryEntity } from './entities/service-category.entity';

@ApiTags('Service Categories')
@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(
    private readonly serviceCategoriesService: ServiceCategoriesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service category',
    description:
      'Create a new service category (e.g., Bathroom Type, Shower Type) for a specific project type. Supports multipart/form-data for image upload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service category created successfully',
    type: ServiceCategoryEntity,
    schema: {
      example: {
        message: 'Service category created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          projectTypeId: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Bathroom Type',
          description: 'Different types of bathroom configurations',
          displayOrder: 0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Service category with this name already exists for this project type',
  })
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createServiceCategoryDto: CreateServiceCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.serviceCategoriesService.create(
      createServiceCategoryDto,
      image,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all service categories',
    description:
      'Retrieve all service categories with optional filtering by status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of service categories retrieved successfully',
    type: [ServiceCategoryEntity],
    schema: {
      example: {
        message: 'Service categories retrieved successfully',
        count: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            projectTypeId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Bathroom Type',
            description: 'Different types of bathroom configurations',
            displayOrder: 0,
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            projectTypeId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Shower Type',
            description: 'Different types of shower configurations',
            displayOrder: 1,
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBool =
      isActive === undefined ? undefined : isActive === 'true';
    return this.serviceCategoriesService.findAll(isActiveBool);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get only active service categories',
    description:
      'Retrieve all active service categories with their active services',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of active service categories retrieved successfully',
    type: [ServiceCategoryEntity],
    schema: {
      example: {
        message: 'Active service categories retrieved successfully',
        count: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            projectTypeId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Bathroom Type',
            description: 'Different types of bathroom configurations',
            displayOrder: 0,
            isActive: true,
            services: [
              {
                id: 'service-123',
                name: 'Half Bath',
                isActive: true,
              },
            ],
          },
        ],
      },
    },
  })
  findActive() {
    return this.serviceCategoriesService.findActive();
  }

  @Get('project-type/:projectTypeId')
  @ApiOperation({
    summary: 'Get all categories for a project type',
    description:
      'Retrieve all service categories that belong to a specific project type',
  })
  @ApiParam({
    name: 'projectTypeId',
    description: 'Project type unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service categories retrieved successfully',
    type: [ServiceCategoryEntity],
    schema: {
      example: {
        message:
          'Service categories for project type "Bathroom Renovation" retrieved successfully',
        count: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            projectTypeId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Bathroom Type',
            description: 'Different types of bathroom configurations',
            displayOrder: 0,
            isActive: true,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project type not found',
  })
  findByProjectType(@Param('projectTypeId') projectTypeId: string) {
    return this.serviceCategoriesService.findByProjectType(projectTypeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service category by ID',
    description:
      'Retrieve a specific service category by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Service category unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service category found',
    type: ServiceCategoryEntity,
    schema: {
      example: {
        message: 'Service category retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          projectTypeId: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Bathroom Type',
          description: 'Different types of bathroom configurations',
          displayOrder: 0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service category not found',
  })
  findOne(@Param('id') id: string) {
    return this.serviceCategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update service category',
    description:
      'Update an existing service category by its ID. Supports multipart/form-data for image upload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Service category unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service category updated successfully',
    type: ServiceCategoryEntity,
    schema: {
      example: {
        message: 'Service category updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          projectTypeId: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Updated Bathroom Type',
          description: 'Updated description',
          displayOrder: 0,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service category or project type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Service category with this name already exists for this project type',
  })
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateServiceCategoryDto: UpdateServiceCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.serviceCategoriesService.update(
      id,
      updateServiceCategoryDto,
      image,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete service category',
    description:
      'Permanently delete a service category. Cannot delete if there are existing services.',
  })
  @ApiParam({
    name: 'id',
    description: 'Service category unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service category deleted successfully',
    schema: {
      example: {
        message: 'Service category deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete service category with existing services',
  })
  remove(@Param('id') id: string) {
    return this.serviceCategoriesService.remove(id);
  }
}
