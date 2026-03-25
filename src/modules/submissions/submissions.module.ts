import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { PdfGeneratorService } from '../pdf/pdf-generator.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ZipLookupService } from './zip-lookup.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, PdfGeneratorService, ZipLookupService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
