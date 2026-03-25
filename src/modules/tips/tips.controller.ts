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
import { TipsService } from './tips.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { TipResponseDto } from './dto/tip-response.dto';

@ApiTags('Tips')
@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tip' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tip created successfully',
    type: TipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  create(@Body() createTipDto: CreateTipDto) {
    return this.tipsService.create(createTipDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tips',
    description: 'Retrieve all tips with optional filtering by position',
  })
  @ApiQuery({
    name: 'position',
    required: false,
    type: Number,
    description: 'Filter tips by position (e.g. 1, 2, 3)',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tips retrieved successfully',
    type: [TipResponseDto],
  })
  findAll(@Query('position') position?: string) {
    const positionFilter =
      position !== undefined ? parseInt(position, 10) : undefined;
    return this.tipsService.findAll(
      positionFilter && !isNaN(positionFilter) ? positionFilter : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tip by ID' })
  @ApiParam({ name: 'id', description: 'Tip UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tip found',
    type: TipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tip not found',
  })
  findOne(@Param('id') id: string) {
    return this.tipsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tip' })
  @ApiParam({ name: 'id', description: 'Tip UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tip updated successfully',
    type: TipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tip not found',
  })
  update(@Param('id') id: string, @Body() updateTipDto: UpdateTipDto) {
    return this.tipsService.update(id, updateTipDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tip' })
  @ApiParam({ name: 'id', description: 'Tip UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tip deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tip not found',
  })
  remove(@Param('id') id: string) {
    return this.tipsService.remove(id);
  }
}
