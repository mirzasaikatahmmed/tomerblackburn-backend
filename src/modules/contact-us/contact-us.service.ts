import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { UpdateContactUsDto } from './dto/update-contact-us.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ContactUsService {
  private readonly logger = new Logger(ContactUsService.name);
  private readonly builderTrendUrl =
    'https://buildertrend.net/leads/contactforms/ContactFormFrame.aspx?builderID=61725';

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateContactUsDto) {
    try {
      const contact = await this.prisma.contactUs.create({
        data: createDto,
      });

      // Log activity for notifications (recent activities)
      await this.prisma.activityLog.create({
        data: {
          action: 'create',
          entityType: 'contact_us',
          entityId: contact.id,
          description: `New contact form from ${contact.firstName} ${contact.lastName} (${contact.email})`,
          metadata: JSON.stringify({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
          }),
        },
      });

      this.sendToBuilderTrend(createDto).catch((error) => {
        this.logger.error(
          `Failed to send contact form to BuilderTrend: ${error.message}`,
          error.stack,
        );
      });

      return {
        message: 'Contact form submitted successfully',
        data: contact,
      };
    } catch (error) {
      throw new Error(`Failed to submit contact form: ${error.message}`);
    }
  }

  private async sendToBuilderTrend(data: CreateContactUsDto): Promise<void> {
    let browser = null;
    try {
      this.logger.log('=== Starting BuilderTrend Integration ===');
      this.logger.log(`Data to send: ${JSON.stringify(data, null, 2)}`);

      const fs = await import('fs/promises');
      const path = await import('path');

      this.logger.log('Launching browser...');
      browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080',
        ],
      });

      const page = await browser.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          this.logger.error(`Browser console error: ${msg.text()}`);
        }
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      await page.setViewport({ width: 1920, height: 1080 });

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      );

      this.logger.log(`Navigating to: ${this.builderTrendUrl}`);
      await page.goto(this.builderTrendUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      this.logger.log('✅ Page loaded successfully');

      const fieldPrefix = 'ctl00_ctl00_ctl00_MasterMain_MasterMain_MasterMain_';

      this.logger.log('Filling form fields...');

      await page.waitForSelector(`#${fieldPrefix}LeadContactFirstName`, {
        timeout: 10000,
      });

      const fillField = async (
        fieldId: string,
        value: string,
        label: string,
      ) => {
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 200),
        );

        await page.evaluate(
          (id, val) => {
            const input = document.getElementById(id) as HTMLInputElement;
            if (input) {
              input.focus();
              input.value = val;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('blur', { bubbles: true }));
            }
          },
          fieldId,
          value,
        );
        this.logger.log(`✓ ${label}: ${value}`);
      };

      await fillField(
        `${fieldPrefix}LeadContactFirstName`,
        data.firstName,
        'First Name',
      );
      await fillField(
        `${fieldPrefix}LeadContactLastName`,
        data.lastName,
        'Last Name',
      );
      await fillField(`${fieldPrefix}LeadEmail`, data.email, 'Email');
      await fillField(`${fieldPrefix}LeadPhone`, data.phone, 'Phone');
      await fillField(`${fieldPrefix}LeadStreet`, data.address, 'Address');
      await fillField(`${fieldPrefix}LeadCity`, data.city, 'City');
      await fillField(`${fieldPrefix}LeadState`, data.state, 'State');
      await fillField(`${fieldPrefix}LeadZip`, data.zipCode, 'Zip Code');
      await fillField(
        `${fieldPrefix}LeadGeneralNotes`,
        data.message,
        'Message',
      );

      if (data.projectStartDate) {
        const date = new Date(data.projectStartDate);
        const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
        await fillField(
          `${fieldPrefix}LeadEstimatedConversionDate_Textbox1`,
          formattedDate,
          'Project Start Date',
        );
      }

      await fillField(
        `${fieldPrefix}txtConfirmCaptcha`,
        '2',
        'Security Question',
      );

      this.logger.log('All form fields filled successfully');

      this.logger.log('All form fields filled successfully');

      const beforeScreenshot = path.join(
        process.cwd(),
        'buildertrend-before-submit.png',
      );
      await page.screenshot({ path: beforeScreenshot, fullPage: true });
      this.logger.log(`Screenshot before submit saved to: ${beforeScreenshot}`);

      this.logger.log('Waiting for reCAPTCHA to initialize...');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      this.logger.log('Submitting form with reCAPTCHA...');

      const submitSuccess = await page.evaluate(() => {
        return new Promise((resolve) => {
          if (typeof (window as any).grecaptcha === 'undefined') {
            resolve({ success: false, error: 'grecaptcha not loaded' });
            return;
          }

          const sitekey = '6LevPygrAAAAAHfL_GmVNVaoEMF6e5w_QBmhkuqT';

          (window as any).grecaptcha.enterprise.ready(() => {
            (window as any).grecaptcha.enterprise
              .execute(sitekey, { action: 'submit' })
              .then((token: string) => {
                const tokenInput = document.querySelector(
                  '[name="g-recaptcha-response"]',
                ) as HTMLInputElement;
                if (tokenInput) {
                  tokenInput.value = token;
                }

                const eventTarget =
                  'ctl00$ctl00$ctl00$MasterMain$MasterMain$MasterMain$btnSubmit';

                if (typeof (window as any).__doPostBack === 'function') {
                  (window as any).__doPostBack(eventTarget, '');
                  resolve({ success: true, token: token.substring(0, 50) });
                } else {
                  resolve({ success: false, error: '__doPostBack not found' });
                }
              })
              .catch((error: any) => {
                resolve({ success: false, error: error.toString() });
              });
          });
        });
      });

      this.logger.log(
        `reCAPTCHA execution result: ${JSON.stringify(submitSuccess)}`,
      );

      const response = await page
        .waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 30000,
        })
        .catch(() => null);

      this.logger.log(`Response Status: ${response?.status() || 'N/A'}`);
      this.logger.log(`Final URL: ${page.url()}`);

      const responseHtml = await page.content();

      const responseFile = path.join(
        process.cwd(),
        'buildertrend-response.html',
      );
      await fs.writeFile(responseFile, responseHtml);
      this.logger.log(`Full response saved to: ${responseFile}`);

      const hasFormFields = responseHtml.includes('LeadContactFirstName');
      const hasSuccess =
        responseHtml.toLowerCase().includes('thank you') ||
        responseHtml.toLowerCase().includes('successfully submitted') ||
        responseHtml.toLowerCase().includes('received your') ||
        responseHtml.includes('confirmation');

      const hasValidationError =
        responseHtml.includes('required field') ||
        responseHtml.includes('Please enter') ||
        responseHtml.includes('Please complete') ||
        responseHtml.includes('field is required');

      this.logger.log(`Response analysis:`);
      this.logger.log(`  - Form re-rendered: ${hasFormFields}`);
      this.logger.log(`  - Validation error: ${hasValidationError}`);
      this.logger.log(`  - Success message: ${hasSuccess}`);

      const screenshotPath = path.join(
        process.cwd(),
        'buildertrend-screenshot.png',
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      this.logger.log(`Screenshot saved to: ${screenshotPath}`);

      if (hasSuccess && !hasFormFields) {
        this.logger.log(
          '✅ BuilderTrend submission successful! Lead should appear in your BuilderTrend admin panel.',
        );
      } else if (hasFormFields && !hasSuccess) {
        this.logger.error(
          '❌ Form was re-rendered - submission failed. Check screenshot and response HTML.',
        );
        throw new Error(
          'BuilderTrend submission failed - form validation error',
        );
      } else if (hasSuccess) {
        this.logger.log(
          '✅ Success message detected! Submission appears successful.',
        );
      } else {
        this.logger.warn(
          '⚠️ BuilderTrend response unclear. Check screenshot and response HTML.',
        );
      }
    } catch (error) {
      this.logger.error(`❌ BuilderTrend Error: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        this.logger.log('Browser closed');
      }
    }
  }

  async findAll(isRead?: boolean, page: number = 1, limit: number = 10) {
    try {
      const where = isRead !== undefined ? { isRead } : {};

      const skip = (page - 1) * limit;

      const [contacts, total] = await Promise.all([
        this.prisma.contactUs.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            contactMedia: {
              include: {
                fileInstance: true,
              },
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        }),
        this.prisma.contactUs.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        message:
          contacts.length > 0
            ? 'Contact submissions retrieved successfully'
            : 'No contact submissions found',
        data: contacts,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve contact submissions: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const contact = await this.prisma.contactUs.findUnique({
        where: { id },
        include: {
          contactMedia: {
            include: {
              fileInstance: true,
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
      });

      if (!contact) {
        throw new NotFoundException(
          `Contact submission with ID ${id} not found`,
        );
      }

      return {
        message: 'Contact submission retrieved successfully',
        data: contact,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to retrieve contact submission: ${error.message}`,
      );
    }
  }

  async update(id: string, updateDto: UpdateContactUsDto) {
    try {
      await this.findOne(id);

      const contact = await this.prisma.contactUs.update({
        where: { id },
        data: updateDto,
      });

      return {
        message: 'Contact submission updated successfully',
        data: contact,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update contact submission: ${error.message}`);
    }
  }

  async markAsRead(id: string) {
    try {
      await this.findOne(id);

      const contact = await this.prisma.contactUs.update({
        where: { id },
        data: { isRead: true },
      });

      return {
        message: 'Contact submission marked as read',
        data: contact,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to mark contact submission as read: ${error.message}`,
      );
    }
  }

  async markAsUnread(id: string) {
    try {
      await this.findOne(id);

      const contact = await this.prisma.contactUs.update({
        where: { id },
        data: { isRead: false },
      });

      return {
        message: 'Contact submission marked as unread',
        data: contact,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to mark contact submission as unread: ${error.message}`,
      );
    }
  }

  async markAllAsRead() {
    try {
      const result = await this.prisma.contactUs.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });

      return {
        message: `${result.count} contact submissions marked as read`,
        count: result.count,
      };
    } catch (error) {
      throw new Error(
        `Failed to mark all contact submissions as read: ${error.message}`,
      );
    }
  }

  async getUnreadCount() {
    try {
      const count = await this.prisma.contactUs.count({
        where: { isRead: false },
      });

      return {
        message: 'Unread count retrieved successfully',
        count,
      };
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.prisma.contactUs.delete({
        where: { id },
      });

      return {
        message: 'Contact submission deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete contact submission: ${error.message}`);
    }
  }

  async addMedia(
    contactId: string,
    fileInstanceId: string,
    mediaType: 'PHOTO' | 'VIDEO',
    description?: string,
  ) {
    try {
      const contact = await this.prisma.contactUs.findUnique({
        where: { id: contactId },
      });

      if (!contact) {
        throw new NotFoundException(
          `Contact submission with ID "${contactId}" not found`,
        );
      }

      const fileInstance = await this.prisma.fileInstance.findUnique({
        where: { id: fileInstanceId },
      });

      if (!fileInstance) {
        throw new NotFoundException(
          `File with ID "${fileInstanceId}" not found. Please upload the file first.`,
        );
      }

      const existingMediaCount = await this.prisma.contactMedia.count({
        where: { contactId },
      });

      const media = await this.prisma.contactMedia.create({
        data: {
          contactId,
          fileInstanceId,
          mediaType,
          description,
          displayOrder: existingMediaCount,
        },
        include: {
          fileInstance: true,
        },
      });

      return {
        message: 'Media added to contact submission successfully',
        data: media,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.code === 'P2003') {
        throw new NotFoundException(
          'Invalid contact or file reference. Please verify the IDs.',
        );
      }

      throw new Error(
        `Failed to add media to contact submission: ${error.message || 'Unknown error occurred'}`,
      );
    }
  }

  async removeMedia(mediaId: string) {
    try {
      const media = await this.prisma.contactMedia.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new NotFoundException(
          `Contact media with ID ${mediaId} not found`,
        );
      }

      await this.prisma.contactMedia.delete({
        where: { id: mediaId },
      });

      return {
        message: 'Media removed from contact submission successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new Error(
        `Failed to remove media from contact submission: ${error.message}`,
      );
    }
  }

  async exportToExcel(isRead?: boolean): Promise<ExcelJS.Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();

      // Try multiple possible paths for the template
      const possiblePaths = [
        path.join(process.cwd(), 'Leads Template.xlsx'),
        path.join(process.cwd(), 'dist', 'Leads Template.xlsx'),
        path.join(__dirname, '..', '..', '..', 'Leads Template.xlsx'),
        '/app/Leads Template.xlsx', // Common path in Docker containers
      ];

      let templatePath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          templatePath = testPath;
          this.logger.log(`Found template at: ${templatePath}`);
          break;
        }
      }

      if (!templatePath) {
        const searchedPaths = possiblePaths.join('\n  - ');
        this.logger.error(
          `Template file not found. Searched in:\n  - ${searchedPaths}\nCurrent working directory: ${process.cwd()}`,
        );
        throw new Error(
          `Template file "Leads Template.xlsx" not found. Please ensure the file exists in the project root directory.`,
        );
      }

      await workbook.xlsx.readFile(templatePath);

      const worksheet = workbook.getWorksheet('Blank Template');
      if (!worksheet) {
        throw new Error(
          'Template worksheet "Blank Template" not found in the Excel file',
        );
      }

      const where = isRead !== undefined ? { isRead } : {};
      const contacts = await this.prisma.contactUs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      let currentRow = 2;

      for (const contact of contacts) {
        const row = worksheet.getRow(currentRow);

        const displayName = `${contact.firstName} ${contact.lastName}`;

        row.values = [
          displayName,
          displayName,
          contact.firstName,
          contact.lastName,
          contact.address,
          contact.city,
          contact.state,
          contact.zipCode,
          contact.address,
          contact.city,
          contact.state,
          contact.zipCode,
          'Open',
          null,
          'Contact Form',
          contact.phone,
          null,
          contact.email,
          contact.message,
          null,
          null,
          null,
          null,
        ];

        row.commit();
        currentRow++;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      this.logger.error(
        `Failed to export contacts to Excel: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to export contacts to Excel: ${error.message}`);
    }
  }

  async exportByIds(ids: string[]): Promise<ExcelJS.Buffer> {
    try {
      if (!ids || ids.length === 0) {
        throw new Error('At least one contact ID is required');
      }

      const workbook = new ExcelJS.Workbook();

      const possiblePaths = [
        path.join(process.cwd(), 'Leads Template.xlsx'),
        path.join(process.cwd(), 'dist', 'Leads Template.xlsx'),
        path.join(__dirname, '..', '..', '..', 'Leads Template.xlsx'),
        '/app/Leads Template.xlsx',
      ];

      let templatePath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          templatePath = testPath;
          this.logger.log(`Found template at: ${templatePath}`);
          break;
        }
      }

      if (!templatePath) {
        const searchedPaths = possiblePaths.join('\n  - ');
        this.logger.error(
          `Template file not found. Searched in:\n  - ${searchedPaths}\nCurrent working directory: ${process.cwd()}`,
        );
        throw new Error(
          `Template file "Leads Template.xlsx" not found. Please ensure the file exists in the project root directory.`,
        );
      }

      await workbook.xlsx.readFile(templatePath);

      const worksheet = workbook.getWorksheet('Blank Template');
      if (!worksheet) {
        throw new Error(
          'Template worksheet "Blank Template" not found in the Excel file',
        );
      }

      const contacts = await this.prisma.contactUs.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (contacts.length === 0) {
        throw new NotFoundException('No contacts found with the provided IDs');
      }

      let currentRow = 2;

      for (const contact of contacts) {
        const row = worksheet.getRow(currentRow);

        const displayName = `${contact.firstName} ${contact.lastName}`;

        row.values = [
          displayName,
          displayName,
          contact.firstName,
          contact.lastName,
          contact.address,
          contact.city,
          contact.state,
          contact.zipCode,
          contact.address,
          contact.city,
          contact.state,
          contact.zipCode,
          'Open',
          null,
          'Contact Form',
          contact.phone,
          null,
          contact.email,
          contact.message,
          null,
          null,
          null,
          null,
        ];

        row.commit();
        currentRow++;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      this.logger.error(
        `Failed to export contacts to Excel by IDs: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to export contacts to Excel by IDs: ${error.message}`,
      );
    }
  }
}
