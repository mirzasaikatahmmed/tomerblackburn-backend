import { Module } from '@nestjs/common';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';
import { PrismaService } from '@/common/prisma/prisma.service';

@Module({
  controllers: [TipsController],
  providers: [TipsService, PrismaService],
})
export class TipsModule {}
