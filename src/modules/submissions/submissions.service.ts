import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { CreateNextStepDto } from './dto/create-next-step.dto';
import { UpdateNextStepDto } from './dto/update-next-step.dto';
import { UpdateWhatHappensNextDto } from './dto/update-what-happens-next.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SubmissionStatus } from 'generated/prisma/enums';
import {
  SortOrder,
  SubmissionDateRange,
  SubmissionSortField,
} from './dto/submission-query.dto';
import {
  PdfGeneratorService,
  SubmissionPdfData,
} from '../pdf/pdf-generator.service';
import { EmailService } from '../notifications/email.service';
import { ZipLookupService } from './zip-lookup.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubmissionsService {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly emailService: EmailService,
    private readonly zipLookupService: ZipLookupService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');

    const port = this.configService.get<string>('PORT') || '3000';
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || `http://localhost:${port}`;

    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  private async saveSubmissionAsContact(params: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    projectAddress: string;
    zipCode: string;
    projectNotes: string;
    projectStartDate?: Date | string | null;
  }): Promise<void> {
    const parts = params.clientName.trim().split(/\s+/);
    const firstName = parts[0] || 'N/A';
    const lastName = parts.slice(1).join(' ') || '-';

    let city = 'N/A';
    let state = 'N/A';
    if (params.zipCode.trim()) {
      const location = await this.zipLookupService.getCityState(params.zipCode);
      if (location) {
        city = location.city;
        state = location.state;
      }
    }

    await this.prisma.contactUs.create({
      data: {
        firstName: firstName.slice(0, 100),
        lastName: lastName.slice(0, 100),
        email: params.clientEmail,
        phone: params.clientPhone.slice(0, 50),
        address: params.projectAddress.slice(0, 255),
        city: city.slice(0, 100),
        state: state.slice(0, 50),
        zipCode: (params.zipCode || 'N/A').slice(0, 20),
        message: params.projectNotes,
        projectStartDate: params.projectStartDate
          ? new Date(params.projectStartDate)
          : undefined,
      },
    });
  }

  private async generateSubmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EST-${year}-`;

    const lastSubmission = await this.prisma.submission.findFirst({
      where: {
        submissionNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        submissionNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastSubmission) {
      const lastNumber = parseInt(
        lastSubmission.submissionNumber.replace(prefix, ''),
        10,
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  private async generateAndUploadPdf(
    submissionId: string,
  ): Promise<{ url: string; buffer: Buffer }> {
    // Get full submission data
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        service: true,
        submissionItems: {
          include: {
            costCode: true,
            selectedOption: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(
        `Submission with ID ${submissionId} not found`,
      );
    }

    const siteSettings = await this.prisma.siteSettings.findFirst();

    // Fetch included base items from the service's cost codes
    const includedBaseItems = await this.prisma.costCode.findMany({
      where: {
        serviceCostCodes: { some: { serviceId: submission.serviceId } },
        isIncludedInBase: true,
        isActive: true,
        excludeFromExport: false,
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Prepare PDF data
    const pdfData: SubmissionPdfData = {
      submissionNumber: submission.submissionNumber,
      tagline: siteSettings?.siteDescription ?? undefined,
      clientName: submission.clientName,
      clientEmail: submission.clientEmail,
      clientPhone: submission.clientPhone,
      projectAddress: submission.projectAddress,
      zipCode: submission.zipCode || undefined,
      service: {
        name: submission.service.name,
        code: submission.service.code,
        scopeDescription:
          submission.service.fullDescription ??
          submission.service.shortDescription ??
          undefined,
      },
      basePrice: Number(submission.basePrice),
      markup: Number(submission.markup),
      clientPrice: Number(submission.clientPrice),
      additionalItemsTotal: Number(submission.additionalItemsTotal),
      totalAmount: Number(submission.totalAmount),
      submittedAt: submission.submittedAt,
      includedBaseItems: includedBaseItems.map((cc) => ({
        itemName: cc.elies ?? cc.name,
        itemDescription: cc.description ?? undefined,
      })),
      items: submission.submissionItems.map((item) => ({
        itemName:
          item.itemName ||
          item.costCode?.elies ||
          item.costCode?.name ||
          'Item',
        itemDescription:
          item.itemDescription || item.costCode?.description || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        selectedOptionName: item.selectedOptionName || undefined,
        isEnabled: item.isEnabled,
      })),
      projectNotes: submission.projectNotes || undefined,
    };

    const pdfBuffer =
      await this.pdfGeneratorService.generateSubmissionPdf(pdfData);

    const filename = `${submission.submissionNumber.replace(/\//g, '-')}-${uuidv4()}.pdf`;

    const subfolder = path.join(this.uploadsDir, 'document');
    await fs.mkdir(subfolder, { recursive: true });

    const filePath = path.join(subfolder, filename);

    await fs.writeFile(filePath, pdfBuffer);

    const relativePath = path.join('document', filename).replace(/\\/g, '/');
    const url = `${this.baseUrl}/uploads/${relativePath}`;

    return { url, buffer: pdfBuffer };
  }

  async create(createSubmissionDto: CreateSubmissionDto) {
    try {
      const submissionNumber = await this.generateSubmissionNumber();

      const {
        serviceId,
        clientName,
        clientEmail,
        clientPhone,
        projectAddress,
        zipCode,
        desiredStartDate,
        buildingType,
        buildingTypeId,
        buildingTypeFieldValues,
        basePrice,
        markup: inputMarkup,
        clientPrice: inputClientPrice,
        additionalItemsTotal,
        totalAmount,
        projectNotes,
        additionalDetails,
        items,
      } = createSubmissionDto;

      // Auto-calculate clientPrice from basePrice + markup if not provided
      const markup = inputMarkup ?? 0;
      const clientPrice = inputClientPrice ?? basePrice * (1 + markup / 100);

      // Validate that the service exists
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw new NotFoundException(
          `Service with ID "${serviceId}" not found. Please select a valid service.`,
        );
      }

      // Validate building type and dynamic field values (if provided)
      let resolvedBuildingTypeName: string | undefined = buildingType;
      if (buildingTypeFieldValues?.length && !buildingTypeId) {
        throw new Error(
          'buildingTypeId is required when buildingTypeFieldValues are provided.',
        );
      }

      if (buildingTypeId) {
        const buildingTypeRecord = await this.prisma.buildingType.findUnique({
          where: { id: buildingTypeId },
          include: { fields: true },
        });

        if (!buildingTypeRecord) {
          throw new NotFoundException(
            `Building type with ID "${buildingTypeId}" not found.`,
          );
        }

        if (!resolvedBuildingTypeName) {
          resolvedBuildingTypeName = buildingTypeRecord.name;
        }

        if (buildingTypeFieldValues?.length) {
          const allowedFieldIds = new Set(
            buildingTypeRecord.fields.map((f) => f.id),
          );
          const invalid = buildingTypeFieldValues.filter(
            (fv) => !allowedFieldIds.has(fv.fieldId),
          );
          if (invalid.length) {
            throw new Error(
              `One or more buildingTypeFieldValues.fieldId are invalid for buildingTypeId "${buildingTypeId}".`,
            );
          }
        }
      }

      // Validate submission items if provided
      const submissionItemsData = items
        ? await Promise.all(
            items.map(async (item) => {
              const costCode = await this.prisma.costCode.findUnique({
                where: { id: item.costCodeId },
              });

              if (!costCode) {
                throw new NotFoundException(
                  `Cost code with ID "${item.costCodeId}" not found. Please provide valid cost codes.`,
                );
              }

              let selectedOption = null;
              if (item.selectedOptionId) {
                selectedOption = await this.prisma.costCodeOption.findUnique({
                  where: { id: item.selectedOptionId },
                });

                if (!selectedOption) {
                  throw new NotFoundException(
                    `Cost code option with ID "${item.selectedOptionId}" not found. Please provide valid options.`,
                  );
                }
              }

              const totalPrice = item.unitPrice * (item.quantity ?? 1);

              return {
                costCodeId: item.costCodeId,
                selectedOptionId: item.selectedOptionId,
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice,
                totalPrice,
                questionType: costCode?.questionType,
                isEnabled: item.isEnabled ?? true,
                userInputValue: item.userInputValue,
                // Prefer "elies" (alias) if available; fall back to "name"
                itemName: costCode?.elies ?? costCode?.name,
                itemDescription: costCode?.description,
                selectedOptionName: selectedOption?.optionName,
                notes: item.notes,
              };
            }),
          )
        : undefined;

      // Create submission
      let submission = await this.prisma.submission.create({
        data: {
          submissionNumber,
          serviceId,
          clientName,
          clientEmail,
          clientPhone,
          projectAddress,
          zipCode,
          desiredStartDate: desiredStartDate
            ? new Date(desiredStartDate)
            : null,
          buildingType: resolvedBuildingTypeName,
          buildingTypeId,
          basePrice,
          markup,
          clientPrice,
          additionalItemsTotal: additionalItemsTotal ?? 0,
          totalAmount,
          projectNotes,
          additionalDetails,
          status: SubmissionStatus.PENDING,
          submissionItems: submissionItemsData
            ? { create: submissionItemsData }
            : undefined,
          buildingTypeFieldValues: buildingTypeFieldValues?.length
            ? {
                create: buildingTypeFieldValues.map((fv) => ({
                  fieldId: fv.fieldId,
                  value: fv.value,
                })),
              }
            : undefined,
        },
        include: {
          service: true,
          buildingTypeRef: true,
          buildingTypeFieldValues: {
            include: {
              field: true,
            },
          },
          submissionItems: {
            include: {
              costCode: true,
              selectedOption: true,
            },
          },
          submissionMedia: {
            include: {
              fileInstance: true,
            },
          },
        },
      });

      // Log activity for notifications (recent activities)
      await this.prisma.activityLog.create({
        data: {
          action: 'create',
          entityType: 'submission',
          entityId: submission.id,
          description: `New estimate submission ${submission.submissionNumber} from ${submission.clientName}`,
          metadata: JSON.stringify({
            submissionNumber: submission.submissionNumber,
            clientName: submission.clientName,
            clientEmail: submission.clientEmail,
          }),
        },
      });

      this.saveSubmissionAsContact({
        clientName: submission.clientName,
        clientEmail: submission.clientEmail,
        clientPhone: submission.clientPhone,
        projectAddress: submission.projectAddress,
        zipCode: submission.zipCode ?? '',
        projectNotes: submission.projectNotes ?? '',
        projectStartDate: submission.desiredStartDate,
      }).catch((err) => {
        console.error('Failed to save estimator submission as contact:', err);
      });

      let pdfUrl: string | null = null;
      let pdfBuffer: Buffer | undefined;
      try {
        const pdfResult = await this.generateAndUploadPdf(submission.id);
        pdfUrl = pdfResult.url;
        pdfBuffer = pdfResult.buffer;

        submission = await this.prisma.submission.update({
          where: { id: submission.id },
          data: { pdfUrl },
          include: {
            service: true,
            buildingTypeRef: true,
            buildingTypeFieldValues: {
              include: {
                field: true,
              },
            },
            submissionItems: {
              include: {
                costCode: true,
                selectedOption: true,
              },
            },
            submissionMedia: {
              include: {
                fileInstance: true,
              },
            },
          },
        });

        // Send email with PDF attachment
        if (pdfBuffer) {
          this.emailService
            .sendSubmissionEmail(
              submission.id,
              submission.clientEmail,
              submission.clientName,
              submission.submissionNumber,
              pdfUrl,
              pdfBuffer,
            )
            .catch((error) => {
              console.error('Failed to send submission email:', error);
            });
        }
      } catch (pdfError) {
        console.error('Failed to generate PDF:', pdfError);
      }

      return {
        message: 'Estimate submission created successfully',
        data: submission,
        pdfUrl,
      };
    } catch (error) {
      // Handle specific error types
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        const field = error.meta?.field_name || 'unknown';
        if (field.includes('serviceId')) {
          throw new NotFoundException(
            'The selected service does not exist. Please choose a valid service.',
          );
        } else if (field.includes('costCodeId')) {
          throw new NotFoundException(
            'One or more cost codes in the submission items do not exist. Please verify the cost codes.',
          );
        } else {
          throw new NotFoundException(
            `Invalid reference: ${field}. Please check your submission data.`,
          );
        }
      }

      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        throw new Error(
          'A submission with this information already exists. Please check for duplicates.',
        );
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        throw new Error(
          `Validation failed: ${error.message}. Please check your input data.`,
        );
      }

      // Generic error with more context
      throw new Error(
        `Failed to create submission: ${error.message || 'Unknown error occurred'}. Please contact support if the problem persists.`,
      );
    }
  }

  async findAll(
    status?: SubmissionStatus,
    page: number = 1,
    limit: number = 10,
    sortBy: SubmissionSortField = SubmissionSortField.DATE,
    sortOrder: SortOrder = SortOrder.DESC,
    dateRange?: SubmissionDateRange,
    includeArchived: boolean = false,
  ) {
    try {
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (!includeArchived) {
        where.isArchived = false;
      }

      if (dateRange) {
        const days = Number(dateRange);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        where.submittedAt = {
          gte: fromDate,
        };
      }

      const skip = (page - 1) * limit;

      const orderBy =
        sortBy === SubmissionSortField.NAME
          ? { clientName: sortOrder }
          : sortBy === SubmissionSortField.TOTAL
            ? { totalAmount: sortOrder }
            : sortBy === SubmissionSortField.STATUS
              ? { status: sortOrder }
              : sortBy === SubmissionSortField.PROJECT_TYPE
                ? {
                    service: {
                      serviceCategory: {
                        projectType: {
                          name: sortOrder,
                        },
                      },
                    },
                  }
                : { submittedAt: sortOrder };

      const [submissions, total] = await Promise.all([
        this.prisma.submission.findMany({
          where,
          include: {
            service: {
              include: {
                serviceCategory: {
                  include: {
                    projectType: true,
                  },
                },
              },
            },
            buildingTypeRef: true,
            buildingTypeFieldValues: {
              include: {
                field: true,
              },
            },
            submissionItems: {
              include: {
                costCode: true,
                selectedOption: true,
              },
            },
            submissionMedia: {
              include: {
                fileInstance: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.submission.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        message:
          submissions.length > 0
            ? 'Submissions retrieved successfully'
            : 'No submissions found',
        data: submissions,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve submissions: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const submission = await this.prisma.submission.findUnique({
        where: { id },
        include: {
          service: true,
          buildingTypeRef: true,
          buildingTypeFieldValues: {
            include: {
              field: true,
            },
          },
          submissionItems: {
            include: {
              costCode: {
                include: {
                  category: true,
                },
              },
              selectedOption: true,
            },
          },
          submissionMedia: {
            include: {
              fileInstance: true,
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
          emailLogs: {
            orderBy: {
              sentAt: 'desc',
            },
          },
        },
      });

      if (!submission) {
        throw new NotFoundException(`Submission with ID ${id} not found`);
      }

      return {
        message: 'Submission retrieved successfully',
        data: submission,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve submission: ${error.message}`);
    }
  }

  async findBySubmissionNumber(submissionNumber: string) {
    try {
      const submission = await this.prisma.submission.findUnique({
        where: { submissionNumber },
        include: {
          service: true,
          buildingTypeRef: true,
          buildingTypeFieldValues: {
            include: {
              field: true,
            },
          },
          submissionItems: {
            include: {
              costCode: {
                include: {
                  category: true,
                },
              },
              selectedOption: true,
            },
          },
          submissionMedia: {
            include: {
              fileInstance: true,
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
      });

      if (!submission) {
        throw new NotFoundException(
          `Submission with number ${submissionNumber} not found`,
        );
      }

      return {
        message: 'Submission retrieved successfully',
        data: submission,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve submission: ${error.message}`);
    }
  }

  async update(id: string, updateSubmissionDto: UpdateSubmissionDto) {
    try {
      // Check if submission exists
      await this.findOne(id);

      const submission = await this.prisma.submission.update({
        where: { id },
        data: updateSubmissionDto,
        include: {
          service: true,
          submissionItems: {
            include: {
              costCode: true,
              selectedOption: true,
            },
          },
          submissionMedia: {
            include: {
              fileInstance: true,
            },
          },
        },
      });

      return {
        message: 'Submission updated successfully',
        data: submission,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        const field = error.meta?.field_name || 'unknown';
        throw new NotFoundException(
          `Invalid reference in ${field}. Please check your submission data.`,
        );
      }

      // Handle record not found
      if (error.code === 'P2025') {
        throw new NotFoundException(`Submission with ID "${id}" not found.`);
      }

      throw new Error(
        `Failed to update submission: ${error.message || 'Unknown error occurred'}`,
      );
    }
  }

  async updateStatus(id: string, status: SubmissionStatus) {
    try {
      await this.findOne(id);

      const updateData: any = { status };

      if (status === SubmissionStatus.PROCESSING) {
        updateData.reviewedAt = new Date();
      } else if (status === SubmissionStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const submission = await this.prisma.submission.update({
        where: { id },
        data: updateData,
        include: {
          service: true,
          submissionItems: {
            include: {
              costCode: true,
              selectedOption: true,
            },
          },
        },
      });

      return {
        message: `Submission status updated to ${status}`,
        data: submission,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update submission status: ${error.message}`);
    }
  }

  async regeneratePdf(id: string) {
    try {
      const { data: submission } = await this.findOne(id);

      const pdfResult = await this.generateAndUploadPdf(submission.id);

      const updatedSubmission = await this.prisma.submission.update({
        where: { id },
        data: { pdfUrl: pdfResult.url },
        include: {
          service: true,
          submissionItems: {
            include: {
              costCode: true,
              selectedOption: true,
            },
          },
        },
      });

      return {
        message: 'PDF regenerated successfully',
        data: updatedSubmission,
        pdfUrl: pdfResult.url,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to regenerate PDF: ${error.message}`);
    }
  }

  async addMedia(
    submissionId: string,
    fileInstanceId: string,
    mediaType: 'PHOTO' | 'VIDEO',
    description?: string,
  ) {
    try {
      // Validate submission exists
      await this.findOne(submissionId);

      // Validate file instance exists
      const fileInstance = await this.prisma.fileInstance.findUnique({
        where: { id: fileInstanceId },
      });

      if (!fileInstance) {
        throw new NotFoundException(
          `File with ID "${fileInstanceId}" not found. Please upload the file first.`,
        );
      }

      const existingMedia = await this.prisma.submissionMedia.count({
        where: { submissionId },
      });

      const media = await this.prisma.submissionMedia.create({
        data: {
          submissionId,
          fileInstanceId,
          mediaType,
          description,
          displayOrder: existingMedia,
        },
        include: {
          fileInstance: true,
        },
      });

      return {
        message: 'Media added to submission successfully',
        data: media,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        throw new NotFoundException(
          'Invalid submission or file reference. Please verify the IDs.',
        );
      }

      throw new Error(
        `Failed to add media to submission: ${error.message || 'Unknown error occurred'}`,
      );
    }
  }

  async removeMedia(mediaId: string) {
    try {
      const media = await this.prisma.submissionMedia.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new NotFoundException(
          `Submission media with ID ${mediaId} not found`,
        );
      }

      await this.prisma.submissionMedia.delete({
        where: { id: mediaId },
      });

      return {
        message: 'Media removed from submission successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to remove media from submission: ${error.message}`,
      );
    }
  }

  async getDashboardStats() {
    try {
      const [total, pending, processing, completed, revenueResult] =
        await Promise.all([
          this.prisma.submission.count(),
          this.prisma.submission.count({
            where: { status: SubmissionStatus.PENDING },
          }),
          this.prisma.submission.count({
            where: { status: SubmissionStatus.PROCESSING },
          }),
          this.prisma.submission.count({
            where: { status: SubmissionStatus.COMPLETED },
          }),
          this.prisma.submission.aggregate({
            where: { status: SubmissionStatus.COMPLETED },
            _sum: { totalAmount: true },
          }),
        ]);

      // Convert Decimal to number for totalRevenue
      // Prisma returns Decimal as an object, need to convert to number
      const totalRevenueValue = revenueResult._sum.totalAmount;
      const totalRevenue =
        totalRevenueValue !== null && totalRevenueValue !== undefined
          ? Number(totalRevenueValue)
          : 0;

      return {
        message: 'Dashboard stats retrieved successfully',
        data: {
          totalSubmissions: total,
          pending,
          processing,
          completed,
          totalRevenue,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      // Return default values instead of throwing to prevent frontend crashes
      return {
        message: 'Dashboard stats retrieved successfully',
        data: {
          totalSubmissions: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          totalRevenue: 0,
        },
      };
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.prisma.submission.delete({
        where: { id },
      });

      return {
        message: 'Submission deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete submission: ${error.message}`);
    }
  }

  async archiveMany(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new Error('At least one submission ID is required');
    }

    try {
      const result = await this.prisma.submission.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          isArchived: true,
        },
      });

      return {
        message: `${result.count} submission(s) archived successfully`,
        count: result.count,
      };
    } catch (error) {
      throw new Error(`Failed to archive submissions: ${error.message}`);
    }
  }

  async deleteMany(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new Error('At least one submission ID is required');
    }

    try {
      const result = await this.prisma.submission.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return {
        message: `${result.count} submission(s) deleted successfully`,
        count: result.count,
      };
    } catch (error) {
      throw new Error(`Failed to delete submissions: ${error.message}`);
    }
  }

  async getWhatHappensNext() {
    try {
      const steps = await this.prisma.nextStep.findMany({
        orderBy: [{ displayOrder: 'asc' }, { stepNumber: 'asc' }],
      });

      return {
        message: 'Next steps retrieved successfully',
        data: {
          title: 'What happens next?',
          steps: steps.map((step) => ({
            id: step.id,
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
            isActive: step.isActive,
          })),
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve next steps: ${error.message}`);
    }
  }

  async createNextStep(createNextStepDto: CreateNextStepDto) {
    try {
      const existingStep = await this.prisma.nextStep.findUnique({
        where: { stepNumber: createNextStepDto.stepNumber },
      });

      if (existingStep) {
        throw new Error(
          `Step with number ${createNextStepDto.stepNumber} already exists`,
        );
      }

      const nextStep = await this.prisma.nextStep.create({
        data: createNextStepDto,
      });

      return {
        message: 'Next step created successfully',
        data: nextStep,
      };
    } catch (error) {
      throw new Error(`Failed to create next step: ${error.message}`);
    }
  }

  async getAllNextSteps(includeInactive: boolean = false) {
    try {
      const where = includeInactive ? {} : { isActive: true };

      const steps = await this.prisma.nextStep.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { stepNumber: 'asc' }],
      });

      return {
        message: 'Next steps retrieved successfully',
        count: steps.length,
        data: steps,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve next steps: ${error.message}`);
    }
  }

  async getNextStepById(id: string) {
    try {
      const nextStep = await this.prisma.nextStep.findUnique({
        where: { id },
      });

      if (!nextStep) {
        throw new NotFoundException(`Next step with ID ${id} not found`);
      }

      return {
        message: 'Next step retrieved successfully',
        data: nextStep,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve next step: ${error.message}`);
    }
  }

  async updateNextStep(id: string, updateNextStepDto: UpdateNextStepDto) {
    try {
      const existingStep = await this.prisma.nextStep.findUnique({
        where: { id },
      });

      if (!existingStep) {
        throw new NotFoundException(`Next step with ID ${id} not found`);
      }

      if (
        updateNextStepDto.stepNumber &&
        updateNextStepDto.stepNumber !== existingStep.stepNumber
      ) {
        const duplicateStep = await this.prisma.nextStep.findUnique({
          where: { stepNumber: updateNextStepDto.stepNumber },
        });

        if (duplicateStep) {
          throw new Error(
            `Step with number ${updateNextStepDto.stepNumber} already exists`,
          );
        }
      }

      const updatedStep = await this.prisma.nextStep.update({
        where: { id },
        data: updateNextStepDto,
      });

      return {
        message: 'Next step updated successfully',
        data: updatedStep,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update next step: ${error.message}`);
    }
  }

  async deleteNextStep(id: string) {
    try {
      const existingStep = await this.prisma.nextStep.findUnique({
        where: { id },
      });

      if (!existingStep) {
        throw new NotFoundException(`Next step with ID ${id} not found`);
      }

      await this.prisma.nextStep.delete({
        where: { id },
      });

      return {
        message: 'Next step deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete next step: ${error.message}`);
    }
  }

  async exportToExcel(
    status?: SubmissionStatus,
  ): Promise<{ buffer: ExcelJS.Buffer; submissionNumbers: string[] }> {
    const workbook = new ExcelJS.Workbook();

    const possiblePaths = [
      path.join(process.cwd(), 'Submission Template.xlsx'),
      path.join(process.cwd(), 'dist', 'Submission Template.xlsx'),
      path.join(__dirname, '..', '..', '..', 'Submission Template.xlsx'),
      '/app/Submission Template.xlsx',
    ];

    let templatePath: string | null = null;
    for (const testPath of possiblePaths) {
      if (existsSync(testPath)) {
        templatePath = testPath;
        break;
      }
    }

    if (!templatePath) {
      throw new Error(
        'Template file "Submission Template.xlsx" not found. Please ensure the file exists in the project root directory.',
      );
    }

    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet('Blank Template');
    if (!worksheet) {
      throw new Error(
        'Worksheet "Blank Template" not found in Submission Template.xlsx',
      );
    }

    const where = status ? { status } : {};
    const submissions = await this.prisma.submission.findMany({
      where,
      include: {
        service: {
          include: {
            serviceCategory: { include: { projectType: true } },
          },
        },
        submissionItems: {
          include: {
            costCode: {
              include: { category: true },
            },
            selectedOption: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const UNIT_TYPE_LABELS: Record<string, string> = {
      FIXED: 'Fixed',
      PER_SQFT: 'Sqft',
      PER_EACH: 'Each',
      PER_LOT: 'Lot',
      PER_SET: 'Set',
      PER_UPGRADE: 'Upgrade',
    };

    let currentRow = 2;

    for (const submission of submissions) {
      // Item rows: only items with costs; exclude branch-only questions (no Buildertrend line)
      const enabledItems = submission.submissionItems.filter(
        (item) =>
          item.isEnabled &&
          !(item.costCode as { excludeFromExport?: boolean }).excludeFromExport,
      );

      for (const item of enabledItems) {
        const row = worksheet.getRow(currentRow);
        const costCodeTitle = item.itemName || item.costCode.name;

        const unitCostPerUnit = Number(item.costCode.basePrice);
        const clientUnitPrice = Number(item.unitPrice);
        const quantity = Number(item.quantity);
        const totalClientPrice = quantity * clientUnitPrice;
        const totalCost = quantity * unitCostPerUnit;
        const profit = totalClientPrice - totalCost;
        const margin =
          totalClientPrice > 0
            ? (totalClientPrice - totalCost) / totalClientPrice
            : 0;
        const markup =
          totalCost > 0 ? (totalClientPrice - totalCost) / totalCost : 0;

        row.values = [
          item.costCode.category?.name || '', // Col 1: Category
          item.costCode.code, // Col 2: Cost Code
          costCodeTitle, // Col 3: Title
          item.itemDescription || item.costCode.description || '', // Col 4: Description
          quantity, // Col 5: Quantity
          UNIT_TYPE_LABELS[item.costCode.unitType] || 'Fixed', // Col 6: Unit
          unitCostPerUnit, // Col 7: Unit Cost
          '', // Col 8: Cost Type (no data available)
          item.selectedOptionName || item.userInputValue || '', // Col 9: Marked As
          totalCost, // Col 10: Builder Cost (qty × unit cost)
          markup, // Col 11: Markup
          '%', // Col 12: Markup Type
          totalClientPrice, // Col 13: Client Price
          margin, // Col 14: Margin
          profit, // Col 15: Profit
          item.notes || '', // Col 16: Notes
        ];

        row.getCell(5).numFmt = '0.00';
        row.getCell(7).numFmt = '#,##0.00';
        row.getCell(10).numFmt = '#,##0.00';
        row.getCell(11).numFmt = '0.0000';
        row.getCell(13).numFmt = '#,##0.00';
        row.getCell(14).numFmt = '0.0000';
        row.getCell(15).numFmt = '#,##0.00';

        row.commit();
        currentRow++;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const submissionNumbers = submissions.map((s) => s.submissionNumber);
    return { buffer, submissionNumbers };
  }

  async exportByIds(
    ids: string[],
  ): Promise<{ buffer: ExcelJS.Buffer; submissionNumbers: string[] }> {
    if (!ids || ids.length === 0) {
      throw new Error('At least one submission ID is required');
    }

    const workbook = new ExcelJS.Workbook();

    const possiblePaths = [
      path.join(process.cwd(), 'Submission Template.xlsx'),
      path.join(process.cwd(), 'dist', 'Submission Template.xlsx'),
      path.join(__dirname, '..', '..', '..', 'Submission Template.xlsx'),
      '/app/Submission Template.xlsx',
    ];

    let templatePath: string | null = null;
    for (const testPath of possiblePaths) {
      if (existsSync(testPath)) {
        templatePath = testPath;
        break;
      }
    }

    if (!templatePath) {
      throw new Error(
        'Template file "Submission Template.xlsx" not found. Please ensure the file exists in the project root directory.',
      );
    }

    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet('Blank Template');
    if (!worksheet) {
      throw new Error(
        'Worksheet "Blank Template" not found in Submission Template.xlsx',
      );
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        service: {
          include: {
            serviceCategory: { include: { projectType: true } },
          },
        },
        submissionItems: {
          include: {
            costCode: {
              include: { category: true },
            },
            selectedOption: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (submissions.length === 0) {
      throw new NotFoundException('No submissions found with the provided IDs');
    }

    const UNIT_TYPE_LABELS: Record<string, string> = {
      FIXED: 'Fixed',
      PER_SQFT: 'Sqft',
      PER_EACH: 'Each',
      PER_LOT: 'Lot',
      PER_SET: 'Set',
      PER_UPGRADE: 'Upgrade',
    };

    let currentRow = 2;

    for (const submission of submissions) {
      // Item rows: only items with costs; exclude branch-only questions (no Buildertrend line)
      const enabledItems = submission.submissionItems.filter(
        (item) =>
          item.isEnabled &&
          !(item.costCode as { excludeFromExport?: boolean }).excludeFromExport,
      );

      for (const item of enabledItems) {
        const row = worksheet.getRow(currentRow);
        const costCodeTitle = item.itemName || item.costCode.name;

        const unitCostPerUnit = Number(item.costCode.basePrice);
        const clientUnitPrice = Number(item.unitPrice);
        const quantity = Number(item.quantity);
        const totalClientPrice = quantity * clientUnitPrice;
        const totalCost = quantity * unitCostPerUnit;
        const profit = totalClientPrice - totalCost;
        const margin =
          totalClientPrice > 0
            ? (totalClientPrice - totalCost) / totalClientPrice
            : 0;
        const markup =
          totalCost > 0 ? (totalClientPrice - totalCost) / totalCost : 0;

        row.values = [
          item.costCode.category?.name || '', // Col 1: Category
          item.costCode.code, // Col 2: Cost Code
          costCodeTitle, // Col 3: Title
          item.itemDescription || item.costCode.description || '', // Col 4: Description
          quantity, // Col 5: Quantity
          UNIT_TYPE_LABELS[item.costCode.unitType] || 'Fixed', // Col 6: Unit
          unitCostPerUnit, // Col 7: Unit Cost
          '', // Col 8: Cost Type (no data available)
          item.selectedOptionName || item.userInputValue || '', // Col 9: Marked As
          totalCost, // Col 10: Builder Cost (qty × unit cost)
          markup, // Col 11: Markup
          '%', // Col 12: Markup Type
          totalClientPrice, // Col 13: Client Price
          margin, // Col 14: Margin
          profit, // Col 15: Profit
          item.notes || '', // Col 16: Notes
        ];

        row.getCell(5).numFmt = '0.00';
        row.getCell(7).numFmt = '#,##0.00';
        row.getCell(10).numFmt = '#,##0.00';
        row.getCell(11).numFmt = '0.0000';
        row.getCell(13).numFmt = '#,##0.00';
        row.getCell(14).numFmt = '0.0000';
        row.getCell(15).numFmt = '#,##0.00';

        row.commit();
        currentRow++;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const submissionNumbers = submissions.map((s) => s.submissionNumber);
    return { buffer, submissionNumbers };
  }

  async updateWhatHappensNextSteps(dto: UpdateWhatHappensNextDto) {
    try {
      const existingSteps = await this.prisma.nextStep.findMany({
        where: { isActive: true },
      });

      const incomingStepNumbers = new Set(dto.steps.map((s) => s.stepNumber));

      const stepsToDeactivate = existingSteps.filter(
        (step) => !incomingStepNumbers.has(step.stepNumber),
      );

      if (stepsToDeactivate.length > 0) {
        await this.prisma.nextStep.updateMany({
          where: {
            id: {
              in: stepsToDeactivate.map((s) => s.id),
            },
          },
          data: {
            isActive: false,
          },
        });
      }

      const updatedSteps = await Promise.all(
        dto.steps.map(async (step, index) => {
          const existingStep = existingSteps.find(
            (s) => s.stepNumber === step.stepNumber,
          );

          if (existingStep) {
            return this.prisma.nextStep.update({
              where: { id: existingStep.id },
              data: {
                title: step.title,
                description: step.description,
                isActive: step.isActive ?? true,
                displayOrder: step.displayOrder ?? index,
              },
            });
          } else {
            return this.prisma.nextStep.create({
              data: {
                stepNumber: step.stepNumber,
                title: step.title,
                description: step.description,
                isActive: step.isActive ?? true,
                displayOrder: step.displayOrder ?? index,
              },
            });
          }
        }),
      );

      return {
        message: 'What happens next steps updated successfully',
        data: {
          title: dto.title || 'What happens next?',
          steps: updatedSteps.map((step) => ({
            id: step.id,
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
          })),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to update what happens next steps: ${error.message}`,
      );
    }
  }
}
