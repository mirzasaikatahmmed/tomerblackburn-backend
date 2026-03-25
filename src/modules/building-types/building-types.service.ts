import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateBuildingTypeDto } from './dto/create-building-type.dto';
import { UpdateBuildingTypeDto } from './dto/update-building-type.dto';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class BuildingTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateBuildingTypeDto) {
    const existing = await this.prisma.buildingType.findFirst({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Building type with name "${createDto.name}" already exists`,
      );
    }

    const buildingType = await this.prisma.buildingType.create({
      data: {
        name: createDto.name,
        price: createDto.price ?? 0,
        isActive: createDto.isActive ?? true,
        displayOrder: createDto.displayOrder ?? 0,
        fields: createDto.fields?.length
          ? {
              create: createDto.fields.map((f, i) => ({
                label: f.label,
                fieldType: f.fieldType ?? 'text',
                placeholder: f.placeholder,
                isRequired: f.isRequired ?? false,
                displayOrder: f.displayOrder ?? i,
              })),
            }
          : undefined,
      },
      include: {
        fields: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return {
      message: 'Building type created successfully',
      data: buildingType,
    };
  }

  async findAll(activeOnly?: boolean) {
    const where = activeOnly ? { isActive: true } : {};
    const list = await this.prisma.buildingType.findMany({
      where,
      include: {
        fields: { orderBy: { displayOrder: 'asc' } },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      message: 'Building types retrieved successfully',
      count: list.length,
      data: list,
    };
  }

  async findActive() {
    const list = await this.prisma.buildingType.findMany({
      where: { isActive: true },
      include: {
        fields: {
          where: {},
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      message: 'Active building types retrieved successfully',
      count: list.length,
      data: list,
    };
  }

  async findOne(id: string) {
    const buildingType = await this.prisma.buildingType.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!buildingType) {
      throw new NotFoundException(`Building type with ID ${id} not found`);
    }

    return {
      message: 'Building type retrieved successfully',
      data: buildingType,
    };
  }

  async update(id: string, updateDto: UpdateBuildingTypeDto) {
    await this.findOne(id);

    if (updateDto.name) {
      const existing = await this.prisma.buildingType.findFirst({
        where: { name: updateDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Building type with name "${updateDto.name}" already exists`,
        );
      }
    }

    // Handle fields: delete removed, update existing, create new
    const fieldIds = (updateDto.fields ?? [])
      .filter((f) => 'id' in f && f.id)
      .map((f) => (f as { id: string }).id);
    if (fieldIds.length > 0) {
      await this.prisma.buildingTypeField.deleteMany({
        where: {
          buildingTypeId: id,
          id: { notIn: fieldIds },
        },
      });
    }

    const updateData: Record<string, unknown> = {
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.price !== undefined && { price: updateDto.price }),
      ...(updateDto.isActive !== undefined && { isActive: updateDto.isActive }),
      ...(updateDto.displayOrder !== undefined && {
        displayOrder: updateDto.displayOrder,
      }),
    };

    if (updateDto.fields?.length) {
      for (let i = 0; i < updateDto.fields.length; i++) {
        const f = updateDto.fields[i];
        const base = {
          label: f.label,
          fieldType: f.fieldType ?? 'text',
          placeholder: f.placeholder,
          isRequired: f.isRequired ?? false,
          displayOrder: f.displayOrder ?? i,
        };
        if ('id' in f && f.id) {
          await this.prisma.buildingTypeField.update({
            where: { id: (f as { id: string }).id },
            data: base,
          });
        } else {
          await this.prisma.buildingTypeField.create({
            data: {
              ...base,
              buildingTypeId: id,
            },
          });
        }
      }
    }

    const buildingType = await this.prisma.buildingType.update({
      where: { id },
      data: updateData,
      include: {
        fields: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return {
      message: 'Building type updated successfully',
      data: buildingType,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.buildingType.delete({ where: { id } });
    return { message: 'Building type deleted successfully' };
  }
}
