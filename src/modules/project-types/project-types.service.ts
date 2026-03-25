import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateProjectTypeDto } from './dto/create-project-type.dto';
import { UpdateProjectTypeDto } from './dto/update-project-type.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ProjectTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    createProjectTypeDto: CreateProjectTypeDto,
    file?: Express.Multer.File,
  ) {
    try {
      // Check for duplicate name
      const existingProjectType = await this.prisma.projectType.findFirst({
        where: { name: createProjectTypeDto.name },
      });

      if (existingProjectType) {
        throw new ConflictException(
          `Project type with name "${createProjectTypeDto.name}" already exists`,
        );
      }

      let imageId = createProjectTypeDto.imageId;
      if (file) {
        const uploadedFile = await this.uploadService.uploadFile(file);
        imageId = uploadedFile.id;
      }

      const projectType = await this.prisma.projectType.create({
        data: {
          ...createProjectTypeDto,
          imageId,
        },
        include: {
          image: true,
          serviceCategories: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        message: 'Project type created successfully',
        data: projectType,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create project type: ${error.message}`);
    }
  }

  async findAll(isActive?: boolean) {
    try {
      const where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const projectTypes = await this.prisma.projectType.findMany({
        where,
        include: {
          image: true,
          serviceCategories: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return {
        message:
          projectTypes.length > 0
            ? 'Project types retrieved successfully'
            : 'No project types found',
        count: projectTypes.length,
        data: projectTypes,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve project types: ${error.message}`);
    }
  }

  async findActive() {
    try {
      const projectTypes = await this.prisma.projectType.findMany({
        where: { isActive: true },
        include: {
          image: true,
          serviceCategories: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return {
        message:
          projectTypes.length > 0
            ? 'Active project types retrieved successfully'
            : 'No active project types found',
        count: projectTypes.length,
        data: projectTypes,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve active project types: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const projectType = await this.prisma.projectType.findUnique({
        where: { id },
        include: {
          image: true,
          serviceCategories: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!projectType) {
        throw new NotFoundException(`Project type with ID ${id} not found`);
      }

      return {
        message: 'Project type retrieved successfully',
        data: projectType,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve project type: ${error.message}`);
    }
  }

  async update(
    id: string,
    updateProjectTypeDto: UpdateProjectTypeDto,
    file?: Express.Multer.File,
  ) {
    try {
      // Check if project type exists
      await this.findOne(id);

      // Check for duplicate name if name is being updated
      if (updateProjectTypeDto.name) {
        const existingProjectType = await this.prisma.projectType.findFirst({
          where: { name: updateProjectTypeDto.name },
        });

        if (existingProjectType && existingProjectType.id !== id) {
          throw new ConflictException(
            `Project type with name "${updateProjectTypeDto.name}" already exists`,
          );
        }
      }

      let imageId = updateProjectTypeDto.imageId;
      if (file) {
        const uploadedFile = await this.uploadService.uploadFile(file);
        imageId = uploadedFile.id;
      }

      const projectType = await this.prisma.projectType.update({
        where: { id },
        data: {
          ...updateProjectTypeDto,
          imageId,
        },
        include: {
          image: true,
          serviceCategories: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        message: 'Project type updated successfully',
        data: projectType,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update project type: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      // Check if project type exists
      await this.findOne(id);

      // Check if there are associated service categories
      const categoryCount = await this.prisma.serviceCategory.count({
        where: { projectTypeId: id },
      });

      if (categoryCount > 0) {
        throw new ConflictException(
          `Cannot delete project type with existing service categories. Found ${categoryCount} category(ies).`,
        );
      }

      await this.prisma.projectType.delete({
        where: { id },
      });

      return {
        message: 'Project type deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to delete project type: ${error.message}`);
    }
  }
}
