import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';

@Injectable()
export class TipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTipDto: CreateTipDto) {
    try {
      const tip = await this.prisma.tip.create({
        data: createTipDto,
      });

      return {
        message: 'Tip created successfully',
        data: tip,
      };
    } catch (error) {
      throw new Error(`Failed to create tip: ${error.message}`);
    }
  }

  async findAll(position?: number) {
    try {
      const where = position !== undefined ? { position } : {};

      const tips = await this.prisma.tip.findMany({
        where,
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });

      return {
        message:
          tips.length > 0 ? 'Tips retrieved successfully' : 'No tips found',
        count: tips.length,
        data: tips,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve tips: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const tip = await this.prisma.tip.findUnique({
        where: { id },
      });

      if (!tip) {
        throw new NotFoundException(`Tip with ID ${id} not found`);
      }

      return {
        message: 'Tip retrieved successfully',
        data: tip,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve tip: ${error.message}`);
    }
  }

  async update(id: string, updateTipDto: UpdateTipDto) {
    try {
      await this.findOne(id);

      const tip = await this.prisma.tip.update({
        where: { id },
        data: updateTipDto,
      });

      return {
        message: 'Tip updated successfully',
        data: tip,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update tip: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.prisma.tip.delete({
        where: { id },
      });

      return {
        message: 'Tip deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete tip: ${error.message}`);
    }
  }
}
