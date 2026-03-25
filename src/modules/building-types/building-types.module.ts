import { Module } from '@nestjs/common';
import { BuildingTypesService } from './building-types.service';
import { BuildingTypesController } from './building-types.controller';
import { PrismaService } from '@/common/prisma/prisma.service';

@Module({
  controllers: [BuildingTypesController],
  providers: [BuildingTypesService, PrismaService],
  exports: [BuildingTypesService],
})
export class BuildingTypesModule {}
