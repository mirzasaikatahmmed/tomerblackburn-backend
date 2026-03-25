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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BuildingTypesService } from './building-types.service';
import { CreateBuildingTypeDto } from './dto/create-building-type.dto';
import { UpdateBuildingTypeDto } from './dto/update-building-type.dto';

@ApiTags('Building Types')
@Controller('building-types')
export class BuildingTypesController {
  constructor(private readonly buildingTypesService: BuildingTypesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a building type (admin)',
    description:
      'Create a building type with name, price, isActive, and optional dynamic fields.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Building type created successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Name already exists',
  })
  create(@Body() createDto: CreateBuildingTypeDto) {
    return this.buildingTypesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all building types',
    description: 'Retrieve all building types with optional active filter',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'If true, return only active building types',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of building types with fields',
  })
  findAll(@Query('activeOnly') activeOnly?: string) {
    const active = activeOnly === 'true';
    return this.buildingTypesService.findAll(active);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active building types (public)',
    description:
      'Public endpoint for Estimator preview - returns active building types with their dynamic fields. Use when user selects a building type to show corresponding input fields.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active building types with fields for preview page',
  })
  findActive() {
    return this.buildingTypesService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get building type by ID' })
  @ApiParam({ name: 'id', description: 'Building type UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Building type found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.buildingTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update building type (admin)',
    description:
      'Update building type and its dynamic fields. Fields with id are updated, fields without id are created, fields not in the list are removed.',
  })
  @ApiParam({ name: 'id', description: 'Building type UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Building type updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Name already exists',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateBuildingTypeDto) {
    return this.buildingTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete building type (admin)' })
  @ApiParam({ name: 'id', description: 'Building type UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Building type deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.buildingTypesService.remove(id);
  }
}
