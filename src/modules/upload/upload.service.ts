import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { FileType } from 'generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFileResponse {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  fileType: FileType;
  mimeType: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    const port = this.configService.get<string>('PORT') || '3000';
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || `http://localhost:${port}`;

    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadedFileResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      this.validateFile(file);

      const fileType = this.determineFileType(file.mimetype);

      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;

      const subfolder = path.join(this.uploadsDir, fileType);
      await fs.mkdir(subfolder, { recursive: true });

      const filePath = path.join(subfolder, filename);

      await fs.writeFile(filePath, file.buffer);

      const relativePath = path.join(fileType, filename).replace(/\\/g, '/');
      const url = `${this.baseUrl}/uploads/${relativePath}`;

      const fileInstance = await this.prisma.fileInstance.create({
        data: {
          filename,
          originalFilename: file.originalname,
          path: relativePath,
          url,
          fileType,
          mimeType: file.mimetype,
          size: file.size,
        },
      });

      return {
        id: fileInstance.id,
        filename: fileInstance.filename,
        originalFilename: fileInstance.originalFilename,
        url: fileInstance.url,
        fileType: fileInstance.fileType,
        mimeType: fileInstance.mimeType,
        size: fileInstance.size,
      };
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<UploadedFileResponse[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const uploadPromises = files.map((file) => this.uploadFile(file, folder));

      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new BadRequestException(
        `Multiple file upload failed: ${error.message}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const fileInstance = await this.prisma.fileInstance.findUnique({
        where: { id: fileId },
      });

      if (!fileInstance) {
        throw new BadRequestException(`File with ID ${fileId} not found`);
      }

      const filePath = path.join(this.uploadsDir, fileInstance.path);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file from disk: ${error.message}`);
      }

      await this.prisma.fileInstance.delete({
        where: { id: fileId },
      });
    } catch (error) {
      throw new BadRequestException(`File deletion failed: ${error.message}`);
    }
  }

  async getFile(fileId: string) {
    try {
      const fileInstance = await this.prisma.fileInstance.findUnique({
        where: { id: fileId },
      });

      if (!fileInstance) {
        throw new BadRequestException(`File with ID ${fileId} not found`);
      }

      return fileInstance;
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve file: ${error.message}`,
      );
    }
  }

  async getSignedUrl(
    fileId: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const fileInstance = await this.getFile(fileId);

      return fileInstance.url;
    } catch (error) {
      throw new BadRequestException(`Failed to get file URL: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/mpeg',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`,
      );
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }
  }

  async uploadVideo(file: Express.Multer.File): Promise<UploadedFileResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      this.validateVideoFile(file);

      const fileType = this.determineFileType(file.mimetype);

      const ext = path.extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;

      const subfolder = path.join(this.uploadsDir, fileType);
      await fs.mkdir(subfolder, { recursive: true });

      const filePath = path.join(subfolder, filename);

      await fs.writeFile(filePath, file.buffer);

      const relativePath = path.join(fileType, filename).replace(/\\/g, '/');
      const url = `${this.baseUrl}/uploads/${relativePath}`;

      const fileInstance = await this.prisma.fileInstance.create({
        data: {
          filename,
          originalFilename: file.originalname,
          path: relativePath,
          url,
          fileType,
          mimeType: file.mimetype,
          size: file.size,
        },
      });

      return {
        id: fileInstance.id,
        filename: fileInstance.filename,
        originalFilename: fileInstance.originalFilename,
        url: fileInstance.url,
        fileType: fileInstance.fileType,
        mimeType: fileInstance.mimeType,
        size: fileInstance.size,
      };
    } catch (error) {
      throw new BadRequestException(`Video upload failed: ${error.message}`);
    }
  }

  private validateVideoFile(file: Express.Multer.File): void {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedVideoMimeTypes = [
      'video/mp4',
      'video/mpeg',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException(
        `Video file size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`,
      );
    }

    if (!allowedVideoMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not a supported video format`,
      );
    }
  }

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.image;
    } else if (mimeType.startsWith('video/')) {
      return FileType.video;
    } else if (mimeType.startsWith('audio/')) {
      return FileType.audio;
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('msword') ||
      mimeType.includes('document')
    ) {
      return FileType.document;
    } else {
      return FileType.any;
    }
  }
}
