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
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactUsService } from './contact-us.service';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import {
  UpdateContactUsDto,
  ContactUsResponseDto,
} from './dto/update-contact-us.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ExportContactsByIdsDto } from './dto/export-by-ids.dto';

@ApiTags('Contact Us')
@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit contact form',
    description: 'Submit a new contact form inquiry',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contact form submitted successfully',
    type: ContactUsResponseDto,
  })
  create(@Body() createDto: CreateContactUsDto) {
    return this.contactUsService.create(createDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all contact submissions',
    description:
      'Retrieve all contact form submissions with pagination and optional filter',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submissions retrieved successfully',
    type: [ContactUsResponseDto],
  })
  findAll(@Query() query: PaginationQueryDto) {
    const readFilter =
      query.isRead === 'true'
        ? true
        : query.isRead === 'false'
          ? false
          : undefined;
    return this.contactUsService.findAll(readFilter, query.page, query.limit);
  }

  @Get('export')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export contact submissions to Excel',
    description:
      'Export all contact form submissions as an Excel file in BuilderTrend format',
  })
  @ApiQuery({
    name: 'isRead',
    required: false,
    type: Boolean,
    description: 'Filter by read status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submissions exported successfully',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename=contact-submissions.xlsx',
      },
    },
  })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportToExcel(@Res() res: Response, @Query('isRead') isRead?: string) {
    const readFilter =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;

    const buffer = await this.contactUsService.exportToExcel(readFilter);

    const filename = `contact-submissions-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('export')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export specific contact submissions by IDs to Excel',
    description:
      'Export selected contact form submissions as an Excel file in BuilderTrend format',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submissions exported successfully',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename=contact-submissions.xlsx',
      },
    },
  })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportByIds(
    @Res() res: Response,
    @Body() exportByIdsDto: ExportContactsByIdsDto,
  ) {
    const buffer = await this.contactUsService.exportByIds(exportByIdsDto.ids);

    const filename = `contact-submissions-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('unread-count')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unread count',
    description: 'Get count of unread contact submissions',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
  })
  getUnreadCount() {
    return this.contactUsService.getUnreadCount();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get contact submission by ID',
    description: 'Retrieve a specific contact submission',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submission retrieved successfully',
    type: ContactUsResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.contactUsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update contact submission',
    description: 'Update a contact submission',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submission updated successfully',
    type: ContactUsResponseDto,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateContactUsDto) {
    return this.contactUsService.update(id, updateDto);
  }

  @Patch(':id/mark-read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark as read',
    description: 'Mark a contact submission as read',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submission marked as read',
  })
  markAsRead(@Param('id') id: string) {
    return this.contactUsService.markAsRead(id);
  }

  @Patch(':id/mark-unread')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark as unread',
    description: 'Mark a contact submission as unread',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submission marked as unread',
  })
  markAsUnread(@Param('id') id: string) {
    return this.contactUsService.markAsUnread(id);
  }

  @Post('mark-all-read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark all as read',
    description: 'Mark all contact submissions as read',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All contact submissions marked as read',
  })
  markAllAsRead() {
    return this.contactUsService.markAllAsRead();
  }

  @Post(':id/media')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add media to contact submission',
    description: 'Attach an uploaded photo or video to a contact submission',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media attached to contact submission successfully',
  })
  addMedia(
    @Param('id') id: string,
    @Body()
    body: {
      fileInstanceId: string;
      mediaType: 'PHOTO' | 'VIDEO';
      description?: string;
    },
  ) {
    return this.contactUsService.addMedia(
      id,
      body.fileInstanceId,
      body.mediaType,
      body.description,
    );
  }

  @Delete('media/:mediaId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove media from contact submission',
    description: 'Remove an attached media item from a contact submission',
  })
  @ApiParam({
    name: 'mediaId',
    description: 'Contact media ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media removed from contact submission successfully',
  })
  removeMedia(@Param('mediaId') mediaId: string) {
    return this.contactUsService.removeMedia(mediaId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete contact submission',
    description: 'Delete a contact submission',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact submission ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submission deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.contactUsService.remove(id);
  }
}
