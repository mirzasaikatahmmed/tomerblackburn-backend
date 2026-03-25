import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Support both new SMTP_* env keys and legacy EMAIL_* keys
    const host =
      this.configService.get<string>('SMTP_HOST') ||
      this.configService.get<string>('EMAIL_HOST');
    const port =
      this.configService.get<number>('SMTP_PORT') ||
      Number(this.configService.get<string>('EMAIL_PORT'));
    const user =
      this.configService.get<string>('SMTP_USER') ||
      this.configService.get<string>('EMAIL_USER');
    const pass =
      this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('EMAIL_PASS');
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM') ||
      user;

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email configuration is missing. Emails will not be sent.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized successfully');
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }

  async sendSubmissionEmail(
    submissionId: string,
    clientEmail: string,
    clientName: string,
    submissionNumber: string,
    pdfUrl: string,
    pdfBuffer?: Buffer,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping email send.',
      );
      return false;
    }

    try {
      const emailOptions: EmailOptions = {
        to: clientEmail,
        subject: `Your Estimate Submission ${submissionNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank You for Your Submission!</h2>
            <p>Dear ${clientName},</p>
            <p>Thank you for submitting your estimate request. We have received your submission and our team will review it shortly.</p>
            <p><strong>Submission Number:</strong> ${submissionNumber}</p>
            <p>Your estimate details are attached to this email as a PDF document.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <br>
            <p>Best regards,<br>BBurn Builders Team</p>
          </div>
        `,
        attachments: [
          {
            filename: `${submissionNumber}-estimate.pdf`,
            content: pdfBuffer,
          },
        ],
      };

      const fromEmail = this.configService.get<string>('SMTP_FROM');
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
        attachments: emailOptions.attachments,
      });

      this.logger.log(
        `Email sent successfully to ${clientEmail}: ${info.messageId}`,
      );
      console.log(
        `[EmailService] Submission email sent to ${clientEmail} (submissionId=${submissionId}, messageId=${info.messageId})`,
      );

      // Log the email
      await this.prisma.emailLog.create({
        data: {
          submissionId,
          emailType: 'submission_confirmation',
          recipientEmail: clientEmail,
          recipientName: clientName,
          subject: emailOptions.subject,
          body: emailOptions.html,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${clientEmail}: ${error.message}`,
        error.stack,
      );
      console.error(
        `[EmailService] Failed to send submission email to ${clientEmail} (submissionId=${submissionId})`,
        error,
      );

      // Log the failed email
      await this.prisma.emailLog.create({
        data: {
          submissionId,
          emailType: 'submission_confirmation',
          recipientEmail: clientEmail,
          recipientName: clientName,
          subject: `Your Estimate Submission ${submissionNumber}`,
          body: '',
          status: 'failed',
          errorMessage: error.message,
        },
      });

      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping email send.',
      );
      return false;
    }

    try {
      const fromEmail = this.configService.get<string>('SMTP_FROM');
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      this.logger.log(
        `Email sent successfully to ${options.to}: ${info.messageId}`,
      );
      console.log(
        `[EmailService] Email sent to ${options.to} (messageId=${info.messageId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
      );
      console.error(
        `[EmailService] Failed to send email to ${options.to}`,
        error,
      );
      return false;
    }
  }
}
