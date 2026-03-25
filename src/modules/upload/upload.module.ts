import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
