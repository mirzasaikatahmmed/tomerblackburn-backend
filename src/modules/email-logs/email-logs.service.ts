import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmailLogDto } from './dto/create-email-log.dto';
import { UpdateEmailLogDto } from './dto/update-email-log.dto';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class EmailLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEmailLogDto: CreateEmailLogDto) {
    const log = await this.prisma.emailLog.create({
      data: createEmailLogDto as any,
    });
    return {
      message: 'Email log created successfully',
      data: log,
    };
  }

  async findAll() {
    const logs = await this.prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Email logs retrieved successfully',
      count: logs.length,
      data: logs,
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.emailLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Email log with ID ${id} not found`);
    }

    return {
      message: 'Email log retrieved successfully',
      data: log,
    };
  }

  async update(id: string, updateEmailLogDto: UpdateEmailLogDto) {
    await this.findOne(id);

    const log = await this.prisma.emailLog.update({
      where: { id },
      data: updateEmailLogDto as any,
    });

    return {
      message: 'Email log updated successfully',
      data: log,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.emailLog.delete({
      where: { id },
    });

    return {
      message: 'Email log deleted successfully',
    };
  }
}
