import { Module } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoriesController } from './service-categories.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [ServiceCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
