import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  Header,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { CreateNextStepDto } from './dto/create-next-step.dto';
import { UpdateNextStepDto } from './dto/update-next-step.dto';
import { UpdateWhatHappensNextDto } from './dto/update-what-happens-next.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SubmissionQueryDto } from './dto/submission-query.dto';
import { ExportSubmissionsByIdsDto } from './dto/export-by-ids.dto';
import { BulkSubmissionsByIdsDto } from './dto/bulk-action.dto';
import {
  SubmissionStatus,
  QuestionType,
  UnitType,
  MediaType,
} from 'generated/prisma/enums';

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new estimate submission' })
  create(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.submissionsService.create(createSubmissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all submissions with pagination' })
  findAll(@Query() query: SubmissionQueryDto) {
    return this.submissionsService.findAll(
      query.status,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
      query.dateRange,
      query.includeArchived,
    );
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboardStats() {
    return this.submissionsService.getDashboardStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export submissions to Excel' })
  @ApiQuery({ name: 'status', required: false, enum: SubmissionStatus })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportToExcel(
    @Res() res: Response,
    @Query('status') status?: SubmissionStatus,
  ) {
    const { buffer, submissionNumbers } =
      await this.submissionsService.exportToExcel(status);

    const date = new Date().toISOString().split('T')[0];
    const filename =
      submissionNumbers.length === 1
        ? `${submissionNumbers[0]}-${date}.xlsx`
        : `${submissionNumbers.join('_')}-${date}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export specific submissions by IDs to Excel' })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportByIds(
    @Res() res: Response,
    @Body() exportByIdsDto: ExportSubmissionsByIdsDto,
  ) {
    const { buffer, submissionNumbers } =
      await this.submissionsService.exportByIds(exportByIdsDto.ids);

    const date = new Date().toISOString().split('T')[0];
    const filename =
      submissionNumbers.length === 1
        ? `${submissionNumbers[0]}-${date}.xlsx`
        : `${submissionNumbers.join('_')}-${date}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('bulk-archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive submissions in bulk' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submissions archived successfully',
  })
  archiveMany(@Body() dto: BulkSubmissionsByIdsDto) {
    return this.submissionsService.archiveMany(dto.ids);
  }

  @Post('bulk-delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete submissions in bulk' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submissions deleted successfully',
  })
  deleteMany(@Body() dto: BulkSubmissionsByIdsDto) {
    return this.submissionsService.deleteMany(dto.ids);
  }

  @Get('enums')
  @ApiOperation({ summary: 'Get all submission-related enum values' })
  getEnums() {
    return {
      submissionStatus: Object.values(SubmissionStatus),
      questionType: Object.values(QuestionType),
      unitType: Object.values(UnitType),
      mediaType: Object.values(MediaType),
    };
  }

  @Get('what-happens-next')
  @ApiOperation({ summary: 'Get what happens next steps after submission' })
  getWhatHappensNext() {
    return this.submissionsService.getWhatHappensNext();
  }

  @Post('what-happens-next')
  @ApiOperation({
    summary: 'Create or update what happens next steps in bulk',
  })
  updateWhatHappensNext(
    @Body() updateWhatHappensNextDto: UpdateWhatHappensNextDto,
  ) {
    return this.submissionsService.updateWhatHappensNextSteps(
      updateWhatHappensNextDto,
    );
  }

  // Next Steps CRUD endpoints (must be before :id catch-all)
  @Post('next-steps')
  @ApiOperation({ summary: 'Create a new next step' })
  createNextStep(@Body() createNextStepDto: CreateNextStepDto) {
    return this.submissionsService.createNextStep(createNextStepDto);
  }

  @Get('next-steps')
  @ApiOperation({ summary: 'Get all next steps' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive steps',
  })
  getAllNextSteps(@Query('includeInactive') includeInactive: string | boolean) {
    const shouldIncludeInactive =
      includeInactive === 'true' || includeInactive === true;
    return this.submissionsService.getAllNextSteps(shouldIncludeInactive);
  }

  @Get('next-steps/:id')
  @ApiOperation({ summary: 'Get a next step by ID' })
  getNextStepById(@Param('id') id: string) {
    return this.submissionsService.getNextStepById(id);
  }

  @Patch('next-steps/:id')
  @ApiOperation({ summary: 'Update a next step' })
  updateNextStep(
    @Param('id') id: string,
    @Body() updateNextStepDto: UpdateNextStepDto,
  ) {
    return this.submissionsService.updateNextStep(id, updateNextStepDto);
  }

  @Delete('next-steps/:id')
  @ApiOperation({ summary: 'Delete a next step' })
  deleteNextStep(@Param('id') id: string) {
    return this.submissionsService.deleteNextStep(id);
  }

  @Get('by-number/:submissionNumber')
  @ApiOperation({ summary: 'Get submission by submission number' })
  findBySubmissionNumber(@Param('submissionNumber') submissionNumber: string) {
    return this.submissionsService.findBySubmissionNumber(submissionNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get submission by ID' })
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update submission' })
  update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ) {
    return this.submissionsService.update(id, updateSubmissionDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update submission status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.submissionsService.updateStatus(id, updateStatusDto.status);
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'Add media to submission' })
  addMedia(
    @Param('id') id: string,
    @Body()
    body: {
      fileInstanceId: string;
      mediaType: 'PHOTO' | 'VIDEO';
      description?: string;
    },
  ) {
    return this.submissionsService.addMedia(
      id,
      body.fileInstanceId,
      body.mediaType,
      body.description,
    );
  }

  @Delete('media/:mediaId')
  @ApiOperation({ summary: 'Remove media from submission' })
  removeMedia(@Param('mediaId') mediaId: string) {
    return this.submissionsService.removeMedia(mediaId);
  }

  @Post(':id/regenerate-pdf')
  @ApiOperation({ summary: 'Regenerate PDF for submission' })
  regeneratePdf(@Param('id') id: string) {
    return this.submissionsService.regeneratePdf(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete submission' })
  remove(@Param('id') id: string) {
    return this.submissionsService.remove(id);
  }
}
