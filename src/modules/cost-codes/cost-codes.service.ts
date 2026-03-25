import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateCostCodeDto } from './dto/create-cost-code.dto';
import { UpdateCostCodeDto } from './dto/update-cost-code.dto';
import { CostCodeFilterDto } from './dto/cost-code-filter.dto';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class CostCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCostCodeDto: CreateCostCodeDto) {
    try {
      const existingCode = await this.prisma.costCode.findUnique({
        where: { code: createCostCodeDto.code },
      });

      if (existingCode) {
        throw new ConflictException(
          `Cost code with code ${createCostCodeDto.code} already exists`,
        );
      }

      const categoryExists = await this.prisma.costCodeCategory.findUnique({
        where: { id: createCostCodeDto.categoryId },
      });

      if (!categoryExists) {
        throw new NotFoundException(
          `Category with ID ${createCostCodeDto.categoryId} not found`,
        );
      }

      // Validate serviceId if provided
      if (createCostCodeDto.serviceId) {
        const serviceExists = await this.prisma.service.findUnique({
          where: { id: createCostCodeDto.serviceId },
        });

        if (!serviceExists) {
          throw new NotFoundException(
            `Service with ID ${createCostCodeDto.serviceId} not found`,
          );
        }
      }

      // Validate parentCostCodeId if provided
      if (createCostCodeDto.parentCostCodeId) {
        const parentExists = await this.prisma.costCode.findUnique({
          where: { id: createCostCodeDto.parentCostCodeId },
        });

        if (!parentExists) {
          throw new NotFoundException(
            `Parent cost code with ID ${createCostCodeDto.parentCostCodeId} not found`,
          );
        }
      }

      // Auto-calculate clientPrice from basePrice + markup if not provided
      const basePrice = createCostCodeDto.basePrice ?? 0;
      const markup = createCostCodeDto.markup ?? 0;
      const clientPrice =
        createCostCodeDto.clientPrice ?? basePrice * (1 + markup / 100);

      const costCode = await this.prisma.costCode.create({
        data: {
          ...createCostCodeDto,
          markup,
          clientPrice,
        },
        include: {
          category: true,
          service: true,
          options: {
            orderBy: { displayOrder: 'asc' },
          },
          parentCostCode: true,
          childCostCodes: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        message: 'Cost code created successfully',
        data: costCode,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(`Failed to create cost code: ${error.message}`);
    }
  }

  async findAll(filterDto: CostCodeFilterDto) {
    try {
      const {
        categoryId,
        serviceId,
        questionType,
        unitType,
        isActive,
        isIncludedInBase,
        includeOptions,
        includeCategory,
        includeServiceRelation,
      } = filterDto;

      const where: any = {};

      if (categoryId) where.categoryId = categoryId;
      if (serviceId) where.serviceId = serviceId;
      if (questionType) where.questionType = questionType;
      if (unitType) where.unitType = unitType;
      if (isActive !== undefined) where.isActive = isActive;
      if (isIncludedInBase !== undefined)
        where.isIncludedInBase = isIncludedInBase;

      const costCodes = await this.prisma.costCode.findMany({
        where,
        include: {
          category: includeCategory,
          service: includeServiceRelation,
          options: includeOptions
            ? {
                orderBy: { displayOrder: 'asc' },
              }
            : false,
          parentCostCode: true,
          childCostCodes: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      });

      return {
        message:
          costCodes.length > 0
            ? 'Cost codes retrieved successfully'
            : 'No cost codes found',
        count: costCodes.length,
        data: costCodes,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve cost codes: ${error.message}`);
    }
  }

  async findByCategory(categoryId: string) {
    try {
      const costCodes = await this.prisma.costCode.findMany({
        where: {
          categoryId,
          isActive: true,
        },
        include: {
          category: true,
          service: true,
          options: {
            orderBy: { displayOrder: 'asc' },
          },
          parentCostCode: true,
          childCostCodes: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      });

      return {
        message:
          costCodes.length > 0
            ? 'Cost codes retrieved successfully'
            : 'No cost codes found in this category',
        count: costCodes.length,
        data: costCodes,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve cost codes by category: ${error.message}`,
      );
    }
  }

  async findByBathroomType(bathroomTypeId: string, includeOptions = true) {
    try {
      // Find service cost codes via junction table
      const serviceCostCodes = await this.prisma.serviceCostCode.findMany({
        where: {
          serviceId: bathroomTypeId,
          isVisible: true,
          costCode: {
            isActive: true,
          },
        },
        include: {
          costCode: {
            include: {
              category: true,
              service: true,
              options: includeOptions
                ? {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                  }
                : false,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }],
      });

      const costCodes = serviceCostCodes.map((scc) => ({
        ...scc.costCode,
        // Include junction table overrides
        isIncludedInBase: scc.isIncludedInBase,
        isRequired: scc.isRequired,
        defaultQuantity: scc.defaultQuantity,
        priceOverride: scc.priceOverride,
        displayOrder: scc.displayOrder,
      }));

      return {
        message:
          costCodes.length > 0
            ? 'Cost codes for service retrieved successfully'
            : 'No cost codes found for this service',
        count: costCodes.length,
        data: costCodes,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve cost codes by service: ${error.message}`,
      );
    }
  }

  async findByQuestionType(questionType: string) {
    try {
      const costCodes = await this.prisma.costCode.findMany({
        where: {
          questionType: questionType as any,
          isActive: true,
        },
        include: {
          category: true,
          service: true,
          options: {
            orderBy: { displayOrder: 'asc' },
          },
          parentCostCode: true,
          childCostCodes: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      });

      return {
        message:
          costCodes.length > 0
            ? `Cost codes with ${questionType} question type retrieved successfully`
            : `No cost codes found with ${questionType} question type`,
        count: costCodes.length,
        data: costCodes,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve cost codes by question type: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const costCode = await this.prisma.costCode.findUnique({
        where: { id },
        include: {
          category: true,
          service: true,
          options: {
            orderBy: { displayOrder: 'asc' },
          },
          serviceCostCodes: {
            include: {
              service: true,
            },
          },
          parentCostCode: true,
          childCostCodes: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!costCode) {
        throw new NotFoundException(`Cost code with ID ${id} not found`);
      }

      return {
        message: 'Cost code retrieved successfully',
        data: costCode,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve cost code: ${error.message}`);
    }
  }

  async findByCode(code: string) {
    try {
      const costCode = await this.prisma.costCode.findUnique({
        where: { code },
        include: {
          category: true,
          service: true,
          options: {
            orderBy: { displayOrder: 'asc' },
          },
          parentCostCode: true,
          childCostCodes: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!costCode) {
        throw new NotFoundException(`Cost code with code ${code} not found`);
      }

      return {
        message: 'Cost code retrieved successfully',
        data: costCode,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve cost code: ${error.message}`);
    }
  }

  async update(id: string, updateCostCodeDto: UpdateCostCodeDto) {
    try {
      await this.findOne(id);

      if (updateCostCodeDto.code) {
        const existingCode = await this.prisma.costCode.findUnique({
          where: { code: updateCostCodeDto.code },
        });

        if (existingCode && existingCode.id !== id) {
          throw new ConflictException(
            `Cost code with code ${updateCostCodeDto.code} already exists`,
          );
        }
      }

      if (updateCostCodeDto.categoryId) {
        const categoryExists = await this.prisma.costCodeCategory.findUnique({
          where: { id: updateCostCodeDto.categoryId },
        });

        if (!categoryExists) {
          throw new NotFoundException(
            `Category with ID ${updateCostCodeDto.categoryId} not found`,
          );
        }
      }

      // Validate serviceId if being updated
      if (updateCostCodeDto.serviceId) {
        const serviceExists = await this.prisma.service.findUnique({
          where: { id: updateCostCodeDto.serviceId },
        });

        if (!serviceExists) {
          throw new NotFoundException(
            `Service with ID ${updateCostCodeDto.serviceId} not found`,
          );
        }
      }

      // Auto-calculate clientPrice if markup or basePrice changed
      const updateData: any = { ...updateCostCodeDto };

      // Validate parentCostCodeId if being updated
      if (updateCostCodeDto.parentCostCodeId !== undefined) {
        if (
          updateCostCodeDto.parentCostCodeId === '' ||
          updateCostCodeDto.parentCostCodeId === null
        ) {
          // Allow clearing parent (make it top-level)
          updateData.parentCostCodeId = null;
          updateData.showWhenParentValue = null;
        } else {
          const parentExists = await this.prisma.costCode.findUnique({
            where: { id: updateCostCodeDto.parentCostCodeId },
          });

          if (!parentExists) {
            throw new NotFoundException(
              `Parent cost code with ID ${updateCostCodeDto.parentCostCodeId} not found`,
            );
          }

          // Prevent circular dependency
          if (updateCostCodeDto.parentCostCodeId === id) {
            throw new ConflictException('Cost code cannot be its own parent');
          }
        }
      }
      if (
        updateCostCodeDto.basePrice !== undefined ||
        updateCostCodeDto.markup !== undefined
      ) {
        const existingCostCode = (await this.findOne(id)).data;
        const updatedBasePrice =
          updateCostCodeDto.basePrice ?? Number(existingCostCode.basePrice);
        const updatedMarkup =
          updateCostCodeDto.markup ?? Number(existingCostCode.markup);
        if (updateCostCodeDto.clientPrice === undefined) {
          updateData.clientPrice = updatedBasePrice * (1 + updatedMarkup / 100);
        }
      }

      const costCode = await this.prisma.costCode.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          service: true,
          options: {
            orderBy: { displayOrder: 'asc' },
          },
          parentCostCode: true,
          childCostCodes: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        message: 'Cost code updated successfully',
        data: costCode,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update cost code: ${error.message}`);
    }
  }

  async toggleStatus(id: string) {
    try {
      const result = await this.findOne(id);
      const costCode = result.data;

      const updated = await this.prisma.costCode.update({
        where: { id },
        data: { isActive: !costCode.isActive },
        include: {
          category: true,
          service: true,
          options: true,
        },
      });

      return {
        message: 'Cost code status toggled successfully',
        data: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to toggle cost code status: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      const submissionItemCount = await this.prisma.submissionItem.count({
        where: { costCodeId: id },
      });

      if (submissionItemCount > 0) {
        throw new ConflictException(
          `Cannot delete cost code with existing submission items. Found ${submissionItemCount} item(s).`,
        );
      }

      await this.prisma.costCode.delete({
        where: { id },
      });

      return {
        message: 'Cost code deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to delete cost code: ${error.message}`);
    }
  }
}
