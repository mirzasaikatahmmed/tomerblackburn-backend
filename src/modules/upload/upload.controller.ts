import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@ApiTags('File Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @ApiOperation({
    summary: 'Upload a single file',
    description: 'Upload a single file to S3 and store metadata in database',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    schema: {
      example: {
        message: 'File uploaded successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          filename: 'abc123-xyz.jpg',
          originalFilename: 'bathroom-image.jpg',
          url: 'https://bucket.s3.amazonaws.com/uploads/abc123-xyz.jpg',
          fileType: 'image',
          mimeType: 'image/jpeg',
          size: 245678,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file upload failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    try {
      const uploadedFile = await this.uploadService.uploadFile(file);

      return {
        message: 'File uploaded successfully',
        data: uploadedFile,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('multiple')
  @ApiOperation({
    summary: 'Upload multiple files',
    description: 'Upload multiple files to S3 and store metadata in database',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Files to upload (max 10MB each)',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Files uploaded successfully',
    schema: {
      example: {
        message: 'Files uploaded successfully',
        count: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            filename: 'abc123-xyz.jpg',
            originalFilename: 'bathroom-1.jpg',
            url: 'https://bucket.s3.amazonaws.com/uploads/abc123-xyz.jpg',
            fileType: 'image',
            mimeType: 'image/jpeg',
            size: 245678,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid files or upload failed',
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      const uploadedFiles = await this.uploadService.uploadFiles(files);

      return {
        message: 'Files uploaded successfully',
        count: uploadedFiles.length,
        data: uploadedFiles,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('video')
  @ApiOperation({
    summary: 'Upload a video file',
    description: 'Upload a video file with support for up to 100MB file size',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Video file to upload (max 100MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Video uploaded successfully',
    schema: {
      example: {
        message: 'Video uploaded successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          filename: 'abc123-xyz.mp4',
          originalFilename: 'project-video.mp4',
          url: 'http://localhost:3000/uploads/video/abc123-xyz.mp4',
          fileType: 'video',
          mimeType: 'video/mp4',
          size: 52428800,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid video file or upload failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    try {
      const uploadedVideo = await this.uploadService.uploadVideo(file);

      return {
        message: 'Video uploaded successfully',
        data: uploadedVideo,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get file details',
    description: 'Retrieve file metadata by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'File UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File details retrieved successfully',
    schema: {
      example: {
        message: 'File retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          filename: 'abc123-xyz.jpg',
          originalFilename: 'bathroom-image.jpg',
          path: 'uploads/abc123-xyz.jpg',
          url: 'https://bucket.s3.amazonaws.com/uploads/abc123-xyz.jpg',
          fileType: 'image',
          mimeType: 'image/jpeg',
          size: 245678,
          createdAt: '2026-01-06T15:30:00Z',
          updatedAt: '2026-01-06T15:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async getFile(@Param('id') id: string) {
    try {
      const file = await this.uploadService.getFile(id);

      return {
        message: 'File retrieved successfully',
        data: file,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/signed-url')
  @ApiOperation({
    summary: 'Get signed URL for file',
    description: 'Generate a temporary signed URL for file access',
  })
  @ApiParam({
    name: 'id',
    description: 'File UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    type: Number,
    description: 'URL expiration time in seconds (default: 3600)',
    example: 3600,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Signed URL generated successfully',
    schema: {
      example: {
        message: 'Signed URL generated successfully',
        url: 'https://bucket.s3.amazonaws.com/uploads/abc123-xyz.jpg?X-Amz-Algorithm=...',
        expiresIn: 3600,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async getSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    try {
      const url = await this.uploadService.getSignedUrl(id, expiresIn || 3600);

      return {
        message: 'Signed URL generated successfully',
        url,
        expiresIn: expiresIn || 3600,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete file',
    description: 'Delete file from S3 and database',
  })
  @ApiParam({
    name: 'id',
    description: 'File UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully',
    schema: {
      example: {
        message: 'File deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async deleteFile(@Param('id') id: string) {
    try {
      await this.uploadService.deleteFile(id);

      return {
        message: 'File deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
