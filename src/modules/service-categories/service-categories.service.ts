import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    createServiceCategoryDto: CreateServiceCategoryDto,
    file?: Express.Multer.File,
  ) {
    try {
      // Validate that projectTypeId exists
      const projectType = await this.prisma.projectType.findUnique({
        where: { id: createServiceCategoryDto.projectTypeId },
      });

      if (!projectType) {
        throw new NotFoundException(
          `Project type with ID ${createServiceCategoryDto.projectTypeId} not found`,
        );
      }

      // Check for duplicate name within the same project type
      const existingCategory = await this.prisma.serviceCategory.findFirst({
        where: {
          name: createServiceCategoryDto.name,
          projectTypeId: createServiceCategoryDto.projectTypeId,
        },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Service category with name "${createServiceCategoryDto.name}" already exists for this project type`,
        );
      }

      let imageId = createServiceCategoryDto.imageId;
      if (file) {
        const uploadedFile = await this.uploadService.uploadFile(file);
        imageId = uploadedFile.id;
      }

      const serviceCategory = await this.prisma.serviceCategory.create({
        data: {
          ...createServiceCategoryDto,
          imageId,
        },
        include: {
          image: true,
          projectType: true,
          services: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        message: 'Service category created successfully',
        data: serviceCategory,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to create service category: ${error.message}`);
    }
  }

  async findAll(isActive?: boolean) {
    try {
      const where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const serviceCategories = await this.prisma.serviceCategory.findMany({
        where,
        include: {
          image: true,
          projectType: true,
          services: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return {
        message:
          serviceCategories.length > 0
            ? 'Service categories retrieved successfully'
            : 'No service categories found',
        count: serviceCategories.length,
        data: serviceCategories,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve service categories: ${error.message}`,
      );
    }
  }

  async findActive() {
    try {
      const serviceCategories = await this.prisma.serviceCategory.findMany({
        where: { isActive: true },
        include: {
          image: true,
          projectType: true,
          services: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return {
        message:
          serviceCategories.length > 0
            ? 'Active service categories retrieved successfully'
            : 'No active service categories found',
        count: serviceCategories.length,
        data: serviceCategories,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve active service categories: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const serviceCategory = await this.prisma.serviceCategory.findUnique({
        where: { id },
        include: {
          image: true,
          projectType: true,
          services: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!serviceCategory) {
        throw new NotFoundException(`Service category with ID ${id} not found`);
      }

      return {
        message: 'Service category retrieved successfully',
        data: serviceCategory,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve service category: ${error.message}`);
    }
  }

  async findByProjectType(projectTypeId: string) {
    try {
      // Validate that projectTypeId exists
      const projectType = await this.prisma.projectType.findUnique({
        where: { id: projectTypeId },
      });

      if (!projectType) {
        throw new NotFoundException(
          `Project type with ID ${projectTypeId} not found`,
        );
      }

      const serviceCategories = await this.prisma.serviceCategory.findMany({
        where: { projectTypeId },
        include: {
          image: true,
          projectType: true,
          services: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return {
        message:
          serviceCategories.length > 0
            ? `Service categories for project type "${projectType.name}" retrieved successfully`
            : `No service categories found for project type "${projectType.name}"`,
        count: serviceCategories.length,
        data: serviceCategories,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to retrieve service categories by project type: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateServiceCategoryDto: UpdateServiceCategoryDto,
    file?: Express.Multer.File,
  ) {
    try {
      // Check if service category exists
      await this.findOne(id);

      // If projectTypeId is being updated, validate it exists
      if (updateServiceCategoryDto.projectTypeId) {
        const projectType = await this.prisma.projectType.findUnique({
          where: { id: updateServiceCategoryDto.projectTypeId },
        });

        if (!projectType) {
          throw new NotFoundException(
            `Project type with ID ${updateServiceCategoryDto.projectTypeId} not found`,
          );
        }
      }

      // Check for duplicate name if name is being updated
      if (updateServiceCategoryDto.name) {
        const existingCategory = await this.prisma.serviceCategory.findFirst({
          where: {
            name: updateServiceCategoryDto.name,
            projectTypeId:
              updateServiceCategoryDto.projectTypeId ||
              (await this.prisma.serviceCategory.findUnique({ where: { id } }))
                ?.projectTypeId,
          },
        });

        if (existingCategory && existingCategory.id !== id) {
          throw new ConflictException(
            `Service category with name "${updateServiceCategoryDto.name}" already exists for this project type`,
          );
        }
      }

      let imageId = updateServiceCategoryDto.imageId;
      if (file) {
        const uploadedFile = await this.uploadService.uploadFile(file);
        imageId = uploadedFile.id;
      }

      const serviceCategory = await this.prisma.serviceCategory.update({
        where: { id },
        data: {
          ...updateServiceCategoryDto,
          imageId,
        },
        include: {
          image: true,
          projectType: true,
          services: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        message: 'Service category updated successfully',
        data: serviceCategory,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update service category: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      // Check if service category exists
      await this.findOne(id);

      // Check if there are associated services
      const serviceCount = await this.prisma.service.count({
        where: { serviceCategoryId: id },
      });

      if (serviceCount > 0) {
        throw new ConflictException(
          `Cannot delete service category with existing services. Found ${serviceCount} service(s).`,
        );
      }

      await this.prisma.serviceCategory.delete({
        where: { id },
      });

      return {
        message: 'Service category deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to delete service category: ${error.message}`);
    }
  }
}
