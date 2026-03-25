import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createServiceDto: CreateServiceDto, file?: Express.Multer.File) {
    try {
      const existingCode = await this.prisma.service.findUnique({
        where: { code: createServiceDto.code },
      });

      if (existingCode) {
        throw new ConflictException(
          `Service with code ${createServiceDto.code} already exists`,
        );
      }

      let imageFileId = createServiceDto.imageFileId;
      if (file) {
        const uploadedFile = await this.uploadService.uploadFile(file);
        imageFileId = uploadedFile.id;
      }

      // Auto-calculate clientPrice from basePrice + markup if not provided
      const markup = createServiceDto.markup ?? 0;
      const clientPrice =
        createServiceDto.clientPrice ??
        createServiceDto.basePrice * (1 + markup / 100);

      const service = await this.prisma.service.create({
        data: {
          ...createServiceDto,
          markup,
          clientPrice,
          imageFileId,
        },
        include: {
          imageFile: true,
          serviceCategory: {
            include: {
              projectType: true,
            },
          },
        },
      });

      return {
        message: 'Service created successfully',
        data: service,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create service: ${error.message}`);
    }
  }

  async findAll(isActive?: boolean) {
    try {
      const services = await this.prisma.service.findMany({
        where: isActive !== undefined ? { isActive } : undefined,
        include: {
          imageFile: true,
          serviceCategory: {
            include: {
              projectType: true,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return {
        message:
          services.length > 0
            ? 'Services retrieved successfully'
            : 'No services found',
        count: services.length,
        data: services,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve services: ${error.message}`);
    }
  }

  async findActive() {
    try {
      const services = await this.prisma.service.findMany({
        where: { isActive: true },
        include: {
          imageFile: true,
          serviceCategory: {
            include: {
              projectType: true,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });

      return {
        message:
          services.length > 0
            ? 'Active services retrieved successfully'
            : 'No active services found',
        count: services.length,
        data: services,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve active services: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
        include: {
          imageFile: true,
          serviceCategory: {
            include: {
              projectType: true,
            },
          },
          serviceCostCodes: {
            include: {
              costCode: {
                include: {
                  category: true,
                  options: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }

      return {
        message: 'Service retrieved successfully',
        data: service,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve service: ${error.message}`);
    }
  }

  async findByCode(code: string) {
    try {
      const service = await this.prisma.service.findUnique({
        where: { code },
        include: {
          imageFile: true,
          serviceCategory: {
            include: {
              projectType: true,
            },
          },
          serviceCostCodes: {
            include: {
              costCode: {
                include: {
                  category: true,
                  options: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        throw new NotFoundException(`Service with code ${code} not found`);
      }

      return {
        message: 'Service retrieved successfully',
        data: service,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve service: ${error.message}`);
    }
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    file?: Express.Multer.File,
  ) {
    try {
      await this.findOne(id);

      if (updateServiceDto.code) {
        const existingCode = await this.prisma.service.findUnique({
          where: { code: updateServiceDto.code },
        });

        if (existingCode && existingCode.id !== id) {
          throw new ConflictException(
            `Service with code ${updateServiceDto.code} already exists`,
          );
        }
      }

      // Upload new file if provided
      let imageFileId = updateServiceDto.imageFileId;
      if (file) {
        const uploadedFile = await this.uploadService.uploadFile(file);
        imageFileId = uploadedFile.id;
      }

      // Auto-calculate clientPrice if markup or basePrice changed
      const updateData: any = { ...updateServiceDto };
      if (
        updateServiceDto.basePrice !== undefined ||
        updateServiceDto.markup !== undefined
      ) {
        const basePrice =
          updateServiceDto.basePrice ??
          Number((await this.findOne(id)).data.basePrice);
        const markup = updateServiceDto.markup ?? 0;
        if (updateServiceDto.clientPrice === undefined) {
          updateData.clientPrice = basePrice * (1 + markup / 100);
        }
      }

      const service = await this.prisma.service.update({
        where: { id },
        data: {
          ...updateData,
          ...(imageFileId && { imageFileId }),
        },
        include: {
          imageFile: true,
          serviceCategory: {
            include: {
              projectType: true,
            },
          },
        },
      });

      return {
        message: 'Service updated successfully',
        data: service,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update service: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      const submissionCount = await this.prisma.submission.count({
        where: { serviceId: id },
      });

      if (submissionCount > 0) {
        throw new ConflictException(
          `Cannot delete service with existing submissions. Found ${submissionCount} submission(s).`,
        );
      }

      await this.prisma.service.delete({
        where: { id },
      });

      return {
        message: 'Service deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to delete service: ${error.message}`);
    }
  }
}
