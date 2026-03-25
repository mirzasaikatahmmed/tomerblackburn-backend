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
import { ProjectTypesService } from './project-types.service';
import { CreateProjectTypeDto } from './dto/create-project-type.dto';
import { UpdateProjectTypeDto } from './dto/update-project-type.dto';
import { ProjectTypeEntity } from './entities/project-type.entity';

@ApiTags('Project Types')
@Controller('project-types')
export class ProjectTypesController {
  constructor(private readonly projectTypesService: ProjectTypesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new project type',
    description:
      'Create a new project type (e.g., Bathroom Renovation, Kitchen Renovation). Supports multipart/form-data for image upload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project type created successfully',
    type: ProjectTypeEntity,
    schema: {
      example: {
        message: 'Project type created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Bathroom Renovation',
          description: 'Complete bathroom renovation services',
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
    status: HttpStatus.CONFLICT,
    description: 'Project type with this name already exists',
  })
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createProjectTypeDto: CreateProjectTypeDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.projectTypesService.create(createProjectTypeDto, image);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all project types',
    description: 'Retrieve all project types with optional filtering by status',
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
    description: 'List of project types retrieved successfully',
    type: [ProjectTypeEntity],
    schema: {
      example: {
        message: 'Project types retrieved successfully',
        count: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Bathroom Renovation',
            description: 'Complete bathroom renovation services',
            displayOrder: 0,
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Kitchen Renovation',
            description: 'Complete kitchen renovation services',
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
    return this.projectTypesService.findAll(isActiveBool);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get only active project types',
    description:
      'Retrieve all active project types with their active service categories',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of active project types retrieved successfully',
    type: [ProjectTypeEntity],
    schema: {
      example: {
        message: 'Active project types retrieved successfully',
        count: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Bathroom Renovation',
            description: 'Complete bathroom renovation services',
            displayOrder: 0,
            isActive: true,
            serviceCategories: [
              {
                id: 'cat-123',
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
    return this.projectTypesService.findActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project type by ID',
    description: 'Retrieve a specific project type by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Project type unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project type found',
    type: ProjectTypeEntity,
    schema: {
      example: {
        message: 'Project type retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Bathroom Renovation',
          description: 'Complete bathroom renovation services',
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
    description: 'Project type not found',
  })
  findOne(@Param('id') id: string) {
    return this.projectTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update project type',
    description:
      'Update an existing project type by its ID. Supports multipart/form-data for image upload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Project type unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project type updated successfully',
    type: ProjectTypeEntity,
    schema: {
      example: {
        message: 'Project type updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Updated Bathroom Renovation',
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
    description: 'Project type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Project type with this name already exists',
  })
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateProjectTypeDto: UpdateProjectTypeDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.projectTypesService.update(id, updateProjectTypeDto, image);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete project type',
    description:
      'Permanently delete a project type. Cannot delete if there are existing service categories.',
  })
  @ApiParam({
    name: 'id',
    description: 'Project type unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project type deleted successfully',
    schema: {
      example: {
        message: 'Project type deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete project type with existing service categories',
  })
  remove(@Param('id') id: string) {
    return this.projectTypesService.remove(id);
  }
}
